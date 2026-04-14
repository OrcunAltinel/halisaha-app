import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tournament_id, team_id } = await request.json()
  if (!tournament_id || !team_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the user is the captain of this team
  const { data: captainCheck } = await supabase
    .from('teams')
    .select('id')
    .eq('id', team_id)
    .eq('captain_id', user.id)
    .maybeSingle()

  if (!captainCheck) {
    return NextResponse.json({ error: 'Only the team captain can register for tournaments' }, { status: 403 })
  }

  const { error } = await supabase
    .from('tournament_registrations')
    .insert({ tournament_id, team_id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tournament_id, team_id } = await request.json()
  if (!tournament_id || !team_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the user is the captain of this team
  const { data: captainCheck } = await supabase
    .from('teams')
    .select('id')
    .eq('id', team_id)
    .eq('captain_id', user.id)
    .maybeSingle()

  if (!captainCheck) {
    return NextResponse.json({ error: 'Only the team captain can withdraw from tournaments' }, { status: 403 })
  }

  const { error } = await supabase
    .from('tournament_registrations')
    .delete()
    .eq('tournament_id', tournament_id)
    .eq('team_id', team_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

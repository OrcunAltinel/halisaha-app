import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: superRow } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, description, max_teams, registration_deadline, start_date } = await request.json()

  if (!name || !max_teams) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      max_teams: parseInt(max_teams, 10),
      registration_deadline: registration_deadline || null,
      start_date: start_date || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create tournament' }, { status: 400 })
  }

  return NextResponse.json({ id: data.id })
}

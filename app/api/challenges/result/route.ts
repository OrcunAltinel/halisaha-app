import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { challenge_id, challenger_score, challenged_score } = await request.json()

  if (!challenge_id || challenger_score == null || challenged_score == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (
    !Number.isInteger(challenger_score) || !Number.isInteger(challenged_score) ||
    challenger_score < 0 || challenged_score < 0
  ) {
    return NextResponse.json({ error: 'Scores must be non-negative integers' }, { status: 400 })
  }

  // Fetch the challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, status, challenger_team_id, challenged_team_id, time_slots(slot_date)')
    .eq('id', challenge_id)
    .maybeSingle()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  if (challenge.status !== 'accepted') {
    return NextResponse.json({ error: 'Can only record results for accepted challenges' }, { status: 400 })
  }

  // Only the captain of either team can enter the result
  const { data: captainTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('captain_id', user.id)
    .in('id', [challenge.challenger_team_id, challenge.challenged_team_id])
    .maybeSingle()

  if (!captainTeam) {
    return NextResponse.json({ error: 'Only the captain of a participating team can enter the result' }, { status: 403 })
  }

  const { error } = await supabase
    .from('challenges')
    .update({
      challenger_score,
      challenged_score,
      status: 'played',
    })
    .eq('id', challenge_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

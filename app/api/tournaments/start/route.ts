import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check super admin
  const { data: superRow } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { tournament_id } = await request.json()
  if (!tournament_id) {
    return NextResponse.json({ error: 'Missing tournament_id' }, { status: 400 })
  }

  // Fetch registrations
  const { data: regs, error: regsError } = await supabase
    .from('tournament_registrations')
    .select('team_id')
    .eq('tournament_id', tournament_id)

  if (regsError || !regs || regs.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 registered teams to start' }, { status: 400 })
  }

  const teamIds = regs.map((r) => r.team_id)

  // Generate round-robin fixtures using the circle method.
  // Each round groups matches so every team plays at most once per round.
  const teams = [...teamIds]
  if (teams.length % 2 !== 0) teams.push('BYE') // pad to even
  const n = teams.length
  const totalRounds = n - 1

  const matches: {
    tournament_id: string
    home_team_id: string
    away_team_id: string
    round: number
  }[] = []

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i]
      const away = teams[n - 1 - i]
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({ tournament_id, home_team_id: home, away_team_id: away, round })
      }
    }
    // Rotate teams[1..n-1] one position clockwise (keep teams[0] fixed)
    const last = teams[n - 1]
    for (let i = n - 1; i > 1; i--) teams[i] = teams[i - 1]
    teams[1] = last
  }

  const { error: matchError } = await supabase
    .from('tournament_matches')
    .insert(matches)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 400 })
  }

  // Create blank standings for each team
  const standings = teamIds.map((team_id) => ({
    tournament_id,
    team_id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }))

  const { error: standingsError } = await supabase
    .from('tournament_standings')
    .insert(standings)

  if (standingsError) {
    return NextResponse.json({ error: standingsError.message }, { status: 400 })
  }

  // Update tournament status
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({ status: 'active' })
    .eq('id', tournament_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

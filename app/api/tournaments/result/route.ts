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

  const { match_id, home_score, away_score } = await request.json()
  if (!match_id || home_score == null || away_score == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from('tournament_matches')
    .select('id, tournament_id, home_team_id, away_team_id, status')
    .eq('id', match_id)
    .maybeSingle()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }
  if (match.status === 'played') {
    return NextResponse.json({ error: 'Match already has a result' }, { status: 400 })
  }

  // Update match
  const { error: updateMatchError } = await supabase
    .from('tournament_matches')
    .update({ home_score, away_score, status: 'played' })
    .eq('id', match_id)

  if (updateMatchError) {
    return NextResponse.json({ error: updateMatchError.message }, { status: 400 })
  }

  // Determine outcomes
  const homeWon = home_score > away_score
  const awayWon = away_score > home_score
  const draw = home_score === away_score

  // Fetch current standings for both teams
  const { data: standingsRows } = await supabase
    .from('tournament_standings')
    .select('*')
    .eq('tournament_id', match.tournament_id)
    .in('team_id', [match.home_team_id, match.away_team_id])

  const standingMap = new Map<string, Record<string, number>>()
  for (const row of standingsRows ?? []) {
    standingMap.set(row.team_id, row)
  }

  const homeStanding = standingMap.get(match.home_team_id) ?? {
    played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0,
  }
  const awayStanding = standingMap.get(match.away_team_id) ?? {
    played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0,
  }

  const newHomeStanding = {
    tournament_id: match.tournament_id,
    team_id: match.home_team_id,
    played: (homeStanding.played as number) + 1,
    wins: (homeStanding.wins as number) + (homeWon ? 1 : 0),
    draws: (homeStanding.draws as number) + (draw ? 1 : 0),
    losses: (homeStanding.losses as number) + (awayWon ? 1 : 0),
    goals_for: (homeStanding.goals_for as number) + home_score,
    goals_against: (homeStanding.goals_against as number) + away_score,
    points: (homeStanding.points as number) + (homeWon ? 3 : draw ? 1 : 0),
  }

  const newAwayStanding = {
    tournament_id: match.tournament_id,
    team_id: match.away_team_id,
    played: (awayStanding.played as number) + 1,
    wins: (awayStanding.wins as number) + (awayWon ? 1 : 0),
    draws: (awayStanding.draws as number) + (draw ? 1 : 0),
    losses: (awayStanding.losses as number) + (homeWon ? 1 : 0),
    goals_for: (awayStanding.goals_for as number) + away_score,
    goals_against: (awayStanding.goals_against as number) + home_score,
    points: (awayStanding.points as number) + (awayWon ? 3 : draw ? 1 : 0),
  }

  const { error: upsertError } = await supabase
    .from('tournament_standings')
    .upsert([newHomeStanding, newAwayStanding], { onConflict: 'tournament_id,team_id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 })
  }

  // Auto-complete: if all matches are now played, mark tournament as completed
  const { data: remainingMatches } = await supabase
    .from('tournament_matches')
    .select('id')
    .eq('tournament_id', match.tournament_id)
    .neq('status', 'played')

  if (remainingMatches && remainingMatches.length === 0) {
    await supabase
      .from('tournaments')
      .update({ status: 'completed' })
      .eq('id', match.tournament_id)
  }

  return NextResponse.json({ ok: true })
}

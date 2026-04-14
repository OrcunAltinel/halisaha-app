import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import TeamProfileClient from '@/components/TeamProfileClient'

type Member = {
  user_id: string
  display_name: string
  joined_at: string
}

type ChallengeEntry = {
  id: string
  status: string
  astroturf_name: string
  slot_date: string
  start_time: string
  end_time: string
  challenger_team_name: string
  challenged_team_name: string
  challenger_score: number | null
  challenged_score: number | null
  created_at: string
}

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch team
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, description, captain_id')
    .eq('id', id)
    .maybeSingle()

  if (!team) notFound()

  // Fetch members via view
  const { data: membersData } = await supabase
    .from('team_members_view')
    .select('user_id, email, joined_at')
    .eq('team_id', id)
    .order('joined_at', { ascending: true })

  const members = (membersData ?? []) as unknown as Member[]

  // Fetch challenges for this team
  const { data: challengesData } = await supabase
    .from('challenges')
    .select(`
      id, status, created_at,
      challenger_team_id, challenged_team_id,
      challenger_score, challenged_score,
      time_slots ( slot_date, start_time, end_time ),
      astroturfs ( name )
    `)
    .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch team names
  const allTeamIds = new Set<string>()
  for (const c of challengesData ?? []) {
    allTeamIds.add(c.challenger_team_id)
    allTeamIds.add(c.challenged_team_id)
  }
  const { data: teamNames } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', Array.from(allTeamIds))

  const teamNameMap = new Map<string, string>()
  for (const t of teamNames ?? []) teamNameMap.set(t.id, t.name)

  const challenges: ChallengeEntry[] = (challengesData ?? []).map((c: any) => ({
    id: c.id,
    status: c.status,
    astroturf_name: c.astroturfs?.name ?? '',
    slot_date: c.time_slots?.slot_date ?? '',
    start_time: c.time_slots?.start_time ?? '',
    end_time: c.time_slots?.end_time ?? '',
    challenger_team_name: teamNameMap.get(c.challenger_team_id) ?? '',
    challenged_team_name: teamNameMap.get(c.challenged_team_id) ?? '',
    challenger_score: c.challenger_score ?? null,
    challenged_score: c.challenged_score ?? null,
    created_at: c.created_at,
  }))

  // Current user's team membership + request status
  let currentUserTeamId: string | null = null
  let currentUserCaptainTeamId: string | null = null
  let currentUserJoinRequestStatus: string | null = null

  if (user) {
    const [{ data: membership }, { data: captainTeam }, { data: joinRequest }] = await Promise.all([
      supabase.from('team_members').select('team_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('teams').select('id').eq('captain_id', user.id).maybeSingle(),
      supabase.from('team_join_requests').select('status').eq('team_id', id).eq('user_id', user.id).maybeSingle(),
    ])
    currentUserTeamId = membership?.team_id ?? null
    currentUserCaptainTeamId = captainTeam?.id ?? null
    currentUserJoinRequestStatus = joinRequest?.status ?? null
  }

  return (
    <TeamProfileClient
      team={team}
      members={members}
      challenges={challenges}
      currentUserId={user?.id ?? null}
      currentUserTeamId={currentUserTeamId}
      currentUserCaptainTeamId={currentUserCaptainTeamId}
      currentUserJoinRequestStatus={currentUserJoinRequestStatus}
    />
  )
}

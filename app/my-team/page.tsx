import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import MyTeamClient from '@/components/MyTeamClient'
import Link from 'next/link'

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
  message: string | null
  created_at: string
}

type JoinRequest = {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

type InviteLink = {
  id: string
  token: string
}

export default async function MyTeamPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/my-team')

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return (
      <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">My Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You are not part of any team yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/teams/create" className="rounded-xl bg-gray-900 dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition">
              Create a team
            </Link>
            <Link href="/teams" className="rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition">
              Browse teams
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const teamId = membership.team_id

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, description, captain_id')
    .eq('id', teamId)
    .single()

  if (!team) redirect('/teams')

  const isCaptain = team.captain_id === user.id

  const { data: membersData } = await supabase
    .from('team_members_view')
    .select('user_id, display_name, joined_at')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  const members = (membersData ?? []) as unknown as Member[]

  // Challenges
  const { data: challengesData } = await supabase
    .from('challenges')
    .select(`
      id, status, message, created_at,
      challenger_team_id, challenged_team_id,
      time_slots ( slot_date, start_time, end_time ),
      astroturfs ( name )
    `)
    .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
    .order('created_at', { ascending: false })

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

  const incoming: ChallengeEntry[] = []
  const outgoing: ChallengeEntry[] = []

  for (const c of (challengesData ?? []) as any[]) {
    const entry: ChallengeEntry = {
      id: c.id,
      status: c.status,
      astroturf_name: c.astroturfs?.name ?? '',
      slot_date: c.time_slots?.slot_date ?? '',
      start_time: c.time_slots?.start_time ?? '',
      end_time: c.time_slots?.end_time ?? '',
      challenger_team_name: teamNameMap.get(c.challenger_team_id) ?? '',
      challenged_team_name: teamNameMap.get(c.challenged_team_id) ?? '',
      message: c.message,
      created_at: c.created_at,
    }
    if (c.challenged_team_id === teamId) incoming.push(entry)
    else if (c.challenger_team_id === teamId) outgoing.push(entry)
  }

  // Join requests (captain only)
  let joinRequests: JoinRequest[] = []
  let inviteLinks: InviteLink[] = []

  if (isCaptain) {
    const [{ data: requestsData }, { data: linksData }] = await Promise.all([
      supabase
        .from('join_requests_view')
        .select('id, user_id, display_name, created_at')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabase
        .from('team_invite_links')
        .select('id, token')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false }),
    ])
    joinRequests = (requestsData ?? []) as JoinRequest[]
    inviteLinks = (linksData ?? []) as InviteLink[]
  }

  return (
    <MyTeamClient
      team={team}
      members={members}
      isCaptain={isCaptain}
      currentUserId={user.id}
      incomingChallenges={incoming}
      outgoingChallenges={outgoing}
      joinRequests={joinRequests}
      inviteLinks={inviteLinks}
    />
  )
}

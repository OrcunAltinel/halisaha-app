import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import JoinViaInviteClient from '@/components/JoinViaInviteClient'

export default async function JoinViaInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createSupabaseServerClient()

  // Look up the invite link (public read policy)
  const { data: link } = await supabase
    .from('team_invite_links')
    .select('team_id')
    .eq('token', token)
    .maybeSingle()

  if (!link) notFound()

  // Fetch team info
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, description')
    .eq('id', link.team_id)
    .maybeSingle()

  if (!team) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // If already in a team, redirect to their team
  if (user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership?.team_id === team.id) {
      redirect('/my-team')
    }
  }

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 text-center">
        <div className="mb-4 text-4xl">⚽</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You&apos;re invited to join
        </h1>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{team.name}</p>
        {team.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{team.description}</p>
        )}

        <JoinViaInviteClient
          token={token}
          teamId={team.id}
          teamName={team.name}
          isLoggedIn={!!user}
        />
      </div>
    </main>
  )
}

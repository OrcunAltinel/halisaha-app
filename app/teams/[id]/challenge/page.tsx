import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import ChallengeWizard from '@/components/ChallengeWizard'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getRequestLocale()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/teams/${id}/challenge`)

  // Must be a captain
  const { data: captainTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('captain_id', user.id)
    .maybeSingle()

  if (!captainTeam) {
    redirect(`/teams/${id}`)
  }

  // Cannot challenge own team
  if (captainTeam.id === id) {
    redirect(`/teams/${id}`)
  }

  // Challenged team must exist
  const { data: challengedTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!challengedTeam) notFound()

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {locale === 'tr' ? `${challengedTeam.name} takımına meydan oku` : `Challenge ${challengedTeam.name}`}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t(locale, 'Pick a pitch and time slot, then send your challenge.', 'Bir saha ve saat seç, sonra meydan okumani gönder.')}
          </p>
        </div>

        <ChallengeWizard
          challengedTeamId={challengedTeam.id}
          challengedTeamName={challengedTeam.name}
          challengerTeamId={captainTeam.id}
        />
      </div>
    </main>
  )
}

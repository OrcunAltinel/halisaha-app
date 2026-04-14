import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import CreateTeamForm from '@/components/CreateTeamForm'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

export default async function CreateTeamPage() {
  const locale = await getRequestLocale()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/teams/create')
  }

  // If user already has a team, send them to it
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) {
    redirect('/my-team')
  }

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t(locale, 'Create a team', 'Takım oluştur')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t(locale, 'You will become the captain. Others can join your team freely.', 'Sen kaptan olacaksin. Diğerleri takımına özgürce katılabilir.')}
        </p>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <CreateTeamForm />
        </div>
      </div>
    </main>
  )
}

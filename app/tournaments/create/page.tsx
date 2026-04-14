import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import CreateTournamentForm from './CreateTournamentForm'

export default async function CreateTournamentPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/tournaments/create')

  const { data: superRow } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superRow) redirect('/')

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
          Create Tournament
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Set up a new round-robin tournament for teams to sign up.
        </p>
        <CreateTournamentForm />
      </div>
    </main>
  )
}

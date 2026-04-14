import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'

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

  async function create(formData: FormData) {
    'use server'
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = (formData.get('name') as string).trim()
    const description = (formData.get('description') as string).trim() || null
    const max_teams = parseInt(formData.get('max_teams') as string, 10)
    const registration_deadline = (formData.get('registration_deadline') as string) || null
    const start_date = (formData.get('start_date') as string) || null

    if (!name || isNaN(max_teams)) return

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        description,
        max_teams,
        registration_deadline,
        start_date,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error || !data) return

    redirect(`/tournaments/${data.id}`)
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
          Create Tournament
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Set up a new round-robin tournament for teams to sign up.
        </p>

        <form action={create} className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tournament name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Cyprus 5-a-side Cup"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Rules, prizes, any extra info..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Max teams *
            </label>
            <select name="max_teams" defaultValue="8" className={inputClass}>
              <option value="4">4 teams</option>
              <option value="6">6 teams</option>
              <option value="8">8 teams</option>
              <option value="10">10 teams</option>
              <option value="12">12 teams</option>
              <option value="16">16 teams</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Registration deadline
              </label>
              <input type="date" name="registration_deadline" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Start date
              </label>
              <input type="date" name="start_date" className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-green-800 py-3 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Create tournament
          </button>
        </form>
      </div>
    </main>
  )
}

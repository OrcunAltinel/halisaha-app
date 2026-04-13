'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getAdminTurfs, type AdminTurf } from '@/lib/admin'
import FootballLoader from '@/components/FootballLoader'

export default function AdminHomePage() {
  const router = useRouter()
  const [turfs, setTurfs] = useState<AdminTurf[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let mounted = true

    const load = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (userError || !user) {
        router.push('/login?redirect=/admin')
        return
      }

      const adminTurfs = await getAdminTurfs(user.id)

      if (!mounted) return

      if (adminTurfs.length === 0) {
        setErrorMessage('You are not an admin of any turf.')
        setLoading(false)
        return
      }

      setTurfs(adminTurfs)
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage the turfs you own.</p>
        </div>

        {loading && <FootballLoader message="Loading your pitches…" />}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
            <p className="font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && (
          <div className="grid gap-4 md:grid-cols-2">
            {turfs.map((t) => (
              <Link
                key={t.astroturf_id}
                href={`/admin/${t.astroturf_id}`}
                className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t.astroturfs?.name || 'Turf'}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t.astroturfs?.address || 'No address'}
                </p>
                <p className="mt-3 text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">Hourly price:</span>{' '}
                  {t.astroturfs?.price_per_hour ?? '-'} TL
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Role: {t.role}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
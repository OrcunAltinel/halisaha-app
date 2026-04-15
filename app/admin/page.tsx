'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getAdminTurfs, type AdminTurf } from '@/lib/admin'
import FootballLoader from '@/components/FootballLoader'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function AdminHomePage() {
  const router = useRouter()
  const { locale } = useLocale()
  const [turfs, setTurfs] = useState<AdminTurf[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const translateRole = (role: string) => {
    if (role === 'owner') return t(locale, 'Owner', 'Sahip')
    if (role === 'manager') return t(locale, 'Manager', 'Yönetici')
    if (role === 'admin') return t(locale, 'Admin', 'Yönetici')
    return role
  }

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
        setErrorMessage(t(locale, 'You are not an admin of any turf.', 'Herhangi bir sahanın yöneticisi değilsin.'))
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
  }, [locale, router])

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t(locale, 'Admin Panel', 'Yönetim Paneli')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t(locale, 'Manage the turfs you own.', 'Sahip olduğun sahaları yönet.')}</p>
        </div>

        {loading && <FootballLoader message={t(locale, 'Loading your pitches…', 'Sahaların yükleniyor…')} />}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
            <p className="font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && (
          <div className="grid gap-4 md:grid-cols-2">
            {turfs.map((turfAdmin) => (
              <Link
                key={turfAdmin.astroturf_id}
                href={`/admin/${turfAdmin.astroturf_id}`}
                className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {turfAdmin.astroturfs?.name || t(locale, 'Turf', 'Saha')}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {turfAdmin.astroturfs?.address || t(locale, 'No address', 'Adres yok')}
                </p>
                <p className="mt-3 text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">{t(locale, 'Hourly price:', 'Saatlik ücret:')}</span>{' '}
                  {turfAdmin.astroturfs?.price_per_hour ?? '-'} TL
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t(locale, 'Role:', 'Rol:')} {translateRole(turfAdmin.role)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

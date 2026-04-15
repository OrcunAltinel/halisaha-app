import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getRequestLocale } from '@/lib/locale-server'
import { t } from '@/lib/locale'
import AddTurfForm from './AddTurfForm'

type TurfRow = {
  id: string
  name: string
  address: string
  price_per_hour: number
  is_active: boolean
}

export default async function SuperAdminPage() {
  const locale = await getRequestLocale()
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/super-admin')

  const { data: superRow } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superRow) redirect('/')

  const { data: turfsData } = await supabase
    .from('astroturfs')
    .select('id, name, address, price_per_hour, is_active')
    .order('name', { ascending: true })

  const turfs = (turfsData ?? []) as TurfRow[]
  const activeCount = turfs.filter((t) => t.is_active).length

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              {t(locale, 'Super Admin', 'Süper Yönetici')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {locale === 'tr'
                ? `${turfs.length} saha · ${activeCount} aktif`
                : `${turfs.length} turfs · ${activeCount} active`}
            </p>
          </div>
          <AddTurfForm />
        </div>

        {/* Turf grid */}
        {turfs.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="font-semibold text-gray-900 dark:text-white">
              {t(locale, 'No turfs yet', 'Henüz saha yok')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t(locale, 'Add the first one above.', 'Yukarıdan ilk sahayı ekle.')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {turfs.map((turf) => (
              <div
                key={turf.id}
                className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 dark:text-white truncate">{turf.name}</h2>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{turf.address}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      turf.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {turf.is_active ? t(locale, 'Active', 'Aktif') : t(locale, 'Inactive', 'Pasif')}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {turf.price_per_hour} TL / {t(locale, 'hour', 'saat')}
                </p>

                <div className="mt-auto">
                  <Link
                    href={`/admin/${turf.id}`}
                    className="block w-full rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-center text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition"
                  >
                    {t(locale, 'Manage', 'Yönet')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}

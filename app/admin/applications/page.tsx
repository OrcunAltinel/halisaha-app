import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import ApplicationActions from '@/components/ApplicationActions'

type Application = {
  id: string
  user_id: string
  user_email: string | null
  name: string
  description: string | null
  address: string
  location_id: string | null
  price_per_hour: number
  phone: string | null
  image_urls: string[]
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  approved_turf_id: string | null
  created_at: string
}

type SearchParams = {
  status?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const styles = {
    pending: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800',
    approved: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 ring-green-200 dark:ring-green-800',
    rejected: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 ring-red-200 dark:ring-red-800',
  }[status]

  const label = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles}`}
    >
      {label}
    </span>
  )
}

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const
type StatusTab = (typeof VALID_STATUSES)[number]

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/applications')
  }

  const { data: superAdminRow } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superAdminRow) {
    redirect('/')
  }

  const params = await searchParams
  const requestedStatus = (params.status || 'pending').toLowerCase()
  const activeStatus: StatusTab = (VALID_STATUSES as readonly string[]).includes(
    requestedStatus
  )
    ? (requestedStatus as StatusTab)
    : 'pending'

  const { data, error } = await supabase
    .from('turf_applications_with_user')
    .select('*')
    .eq('status', activeStatus)
    .order('created_at', { ascending: false })

  const applications = (data ?? []) as Application[]

  const countsResults = await Promise.all(
    VALID_STATUSES.map((s) =>
      supabase
        .from('turf_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', s)
    )
  )
  const counts: Record<StatusTab, number> = {
    pending: countsResults[0].count ?? 0,
    approved: countsResults[1].count ?? 0,
    rejected: countsResults[2].count ?? 0,
  }

  const tabLabels: Record<StatusTab, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Review Applications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review turf owner applications and approve or reject them.
          </p>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {VALID_STATUSES.map((s) => {
            const isActive = s === activeStatus
            return (
              <Link
                key={s}
                href={`/admin/applications?status=${s}`}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tabLabels[s]}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    isActive ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {counts[s]}
                </span>
              </Link>
            )
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            Failed to load applications. Please refresh the page.
          </div>
        )}

        {!error && applications.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-base font-medium text-gray-900 dark:text-white">
              No {activeStatus} applications
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {activeStatus === 'pending'
                ? 'Nothing to review right now. New applications will appear here.'
                : `No applications have been ${activeStatus} yet.`}
            </p>
          </div>
        )}

        {!error && applications.length > 0 && (
          <div className="space-y-5">
            {applications.map((app) => (
              <div
                key={app.id}
                className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{app.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{app.address}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Applicant: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {app.user_email || app.user_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(app.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Price: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₺{app.price_per_hour} / hour
                      </span>
                    </div>
                    {app.phone && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                        <span className="font-medium text-gray-900 dark:text-white">{app.phone}</span>
                      </div>
                    )}
                  </div>

                  {app.description && (
                    <div className="mt-4 rounded-lg bg-gray-200 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <p className="whitespace-pre-wrap">{app.description}</p>
                    </div>
                  )}

                  {app.image_urls && app.image_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Photos ({app.image_urls.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {app.image_urls.map((url, idx) => (

                          <a    key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 transition hover:ring-gray-400 dark:hover:ring-gray-500"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Photo ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.status !== 'pending' && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 text-sm">
                      <p className="text-gray-500 dark:text-gray-400">
                        Reviewed{' '}
                        {app.reviewed_at ? formatDate(app.reviewed_at) : 'recently'}
                      </p>
                      {app.review_notes && (
                        <div
                          className={`mt-2 rounded-lg p-3 ring-1 ${
                            app.status === 'approved'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 ring-green-200 dark:ring-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 ring-red-200 dark:ring-red-800'
                          }`}
                        >
                          <p className="font-semibold">Notes</p>
                          <p className="mt-1">{app.review_notes}</p>
                        </div>
                      )}
                      {app.status === 'approved' && app.approved_turf_id && (
                        <Link
                          href={`/astroturf/${app.approved_turf_id}`}
                          className="mt-2 inline-block text-sm font-semibold text-gray-900 dark:text-white hover:underline"
                        >
                          View live pitch →
                        </Link>
                      )}
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="mt-5 flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
                      <ApplicationActions applicationId={app.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
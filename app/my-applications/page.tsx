import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'

type Application = {
  id: string
  name: string
  address: string
  price_per_hour: number
  image_urls: string[]
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  approved_turf_id: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const styles = {
    pending: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    approved: 'bg-green-50 text-green-800 ring-green-200',
    rejected: 'bg-red-50 text-red-800 ring-red-200',
  }[status]

  const label = {
    pending: 'Under review',
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

export default async function MyApplicationsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/my-applications')
  }

  const { data, error } = await supabase
    .from('turf_applications')
    .select(
      'id, name, address, price_per_hour, image_urls, status, review_notes, reviewed_at, approved_turf_id, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const applications = (data ?? []) as Application[]

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              My applications
            </h1>
            <p className="mt-2 text-gray-600">
              Track the status of the pitches you have submitted for review.
            </p>
          </div>
          <Link
            href="/list-your-pitch"
            className="hidden shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 sm:inline-block"
          >
            New application
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            Failed to load your applications. Please refresh the page.
          </div>
        )}

        {!error && applications.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-base font-medium text-gray-900">
              No applications yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Submit your first pitch to get listed on the platform.
            </p>
            <Link
              href="/list-your-pitch"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              List your pitch
            </Link>
          </div>
        )}

        {!error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const primaryImage = app.image_urls?.[0]
              return (
                <div
                  key={app.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
                >
                  <div className="flex flex-col sm:flex-row">
                    {primaryImage ? (
                      <div className="h-40 w-full shrink-0 bg-gray-100 sm:h-auto sm:w-48">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage}
                          alt={app.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full shrink-0 items-center justify-center bg-gray-100 text-xs text-gray-400 sm:h-auto sm:w-48">
                        No image
                      </div>
                    )}

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {app.name}
                          </h3>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {app.address}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          ₺{app.price_per_hour} / hour
                        </p>

                        {app.status === 'rejected' && app.review_notes && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
                            <p className="font-semibold">Reviewer notes</p>
                            <p className="mt-1">{app.review_notes}</p>
                          </div>
                        )}

                        {app.status === 'approved' && app.review_notes && (
                          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800 ring-1 ring-green-200">
                            <p className="font-semibold">Reviewer notes</p>
                            <p className="mt-1">{app.review_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span>Submitted {formatDate(app.created_at)}</span>
                        {app.status === 'approved' && app.approved_turf_id && (
                          <Link
                            href={`/astroturf/${app.approved_turf_id}`}
                            className="font-semibold text-gray-900 hover:underline"
                          >
                            View live pitch →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type ReservationRow = {
  id: string
  status: string
  payment_status: string
  total_price: number
  created_at: string
  astroturfs: {
    name: string
    address: string
  } | null
  time_slots: {
    slot_date: string
    start_time: string
    end_time: string
  } | null
}

const supabase = createSupabaseBrowserClient()

export default function MyReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadReservations = async () => {
      setLoading(true)
      setErrorMessage('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          payment_status,
          total_price,
          created_at,
          astroturfs (
            name,
            address
          ),
          time_slots (
            slot_date,
            start_time,
            end_time
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      setReservations((data || []) as ReservationRow[])
      setLoading(false)
    }

    loadReservations()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Reservations</h1>
          <p className="mt-2 text-gray-600">See all the slots you have booked.</p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-base font-medium text-gray-700">Loading reservations...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-gray-700">You do not have any reservations yet.</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length > 0 && (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {reservation.astroturfs?.name || 'Astroturf'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {reservation.astroturfs?.address || 'No address'}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-gray-800">
                      <p>
                        <span className="font-semibold">Date:</span>{' '}
                        {reservation.time_slots?.slot_date || '-'}
                      </p>
                      <p>
                        <span className="font-semibold">Time:</span>{' '}
                        {reservation.time_slots?.start_time || '-'} -{' '}
                        {reservation.time_slots?.end_time || '-'}
                      </p>
                      <p>
                        <span className="font-semibold">Price:</span>{' '}
                        {reservation.total_price} TL
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                      Status: {reservation.status}
                    </span>

                    <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                      Payment: {reservation.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
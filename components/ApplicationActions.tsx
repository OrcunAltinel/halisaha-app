'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = {
  applicationId: string
}

type ModalMode = 'approve' | 'reject' | null

export default function ApplicationActions({ applicationId }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [mode, setMode] = useState<ModalMode>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openModal(nextMode: 'approve' | 'reject') {
    setMode(nextMode)
    setNotes('')
    setError(null)
  }

  function closeModal() {
    if (submitting) return
    setMode(null)
    setNotes('')
    setError(null)
  }

  async function handleConfirm() {
    if (!mode) return
    setSubmitting(true)
    setError(null)

    try {
      const rpcName =
        mode === 'approve' ? 'approve_turf_application' : 'reject_turf_application'

      const { error: rpcError } = await supabase.rpc(rpcName, {
        application_id: applicationId,
        notes: notes.trim() || null,
      })

      if (rpcError) throw new Error(rpcError.message)

      setMode(null)
      setNotes('')
      router.refresh()
    } catch (err) {
      console.error('[ApplicationActions] rpc error:', err)
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openModal('reject')}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => openModal('approve')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Approve
        </button>
      </div>

      {mode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">
              {mode === 'approve' ? 'Approve application' : 'Reject application'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'approve'
                ? 'This will create a live pitch on the platform and assign the applicant as its owner. The owner will need to add time slots before players can book.'
                : 'The applicant will see the reason for rejection on their "My applications" page.'}
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-gray-900">
                {mode === 'approve' ? 'Notes (optional)' : 'Reason (optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  mode === 'approve'
                    ? 'Any notes you want the owner to see…'
                    : 'Let the applicant know why this was rejected…'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  mode === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting
                  ? 'Working…'
                  : mode === 'approve'
                  ? 'Confirm approve'
                  : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
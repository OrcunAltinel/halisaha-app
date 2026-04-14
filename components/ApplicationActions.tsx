'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  applicationId: string
}

type ModalMode = 'approve' | 'reject' | null

export default function ApplicationActions({ applicationId }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()

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
        err instanceof Error ? err.message : t(locale, 'Something went wrong. Please try again.', 'Bir şeyler ters gitti. Lütfen tekrar dene.')
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
          className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t(locale, 'Reject', 'Reddet')}
        </button>
        <button
          type="button"
          onClick={() => openModal('approve')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {t(locale, 'Approve', 'Onayla')}
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
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {mode === 'approve' ? t(locale, 'Approve application', 'Başvuruyu onayla') : t(locale, 'Reject application', 'Başvuruyu reddet')}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {mode === 'approve'
                ? t(locale, 'This will create a live pitch on the platform and assign the applicant as its owner. The owner will need to add time slots before players can book.', 'Bu islem platformda canli bir saha oluşturur ve başvuru sahibini sahibi olarak atar. Oyuncular rezervasyon yapmadan once sahibin saat eklemesi gerekir.')
                : t(locale, 'The applicant will see the reason for rejection on their "My applications" page.', 'Başvuru sahibi reddedilme nedenini "Başvurularım" sayfasında görecek.')}
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                {mode === 'approve' ? t(locale, 'Notes (optional)', 'Notlar (isteğe bağlı)') : t(locale, 'Reason (optional)', 'Sebep (isteğe bağlı)')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  mode === 'approve'
                    ? t(locale, 'Any notes you want the owner to see…', 'Sahibin görmesini istedigin notlar…')
                    : t(locale, 'Let the applicant know why this was rejected…', 'Başvuru sahibine neden reddedildigini bildir…')
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {t(locale, 'Cancel', 'İptal')}
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
                  ? t(locale, 'Working…', 'İşleniyor…')
                  : mode === 'approve'
                  ? t(locale, 'Confirm approve', 'Onayi onayla')
                  : t(locale, 'Confirm reject', 'Reddi onayla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

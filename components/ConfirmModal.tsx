'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
  withReason?: boolean
  reasonPlaceholder?: string
  loading?: boolean
  onConfirm: (reason?: string) => void
  onClose: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  variant = 'danger',
  withReason = false,
  reasonPlaceholder,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('')
  const { locale } = useLocale()
  const resolvedConfirmLabel = confirmLabel ?? t(locale, 'Confirm', 'Onayla')
  const resolvedReasonPlaceholder = reasonPlaceholder ?? t(locale, 'Reason (optional)', 'Sebep (isteğe bağlı)')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={() => { if (!loading) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>

        {withReason && (
          <div className="mt-4">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={resolvedReasonPlaceholder}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {t(locale, 'Cancel', 'İptal')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(withReason ? reason : undefined)}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-900 hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
            }`}
          >
            {loading ? t(locale, 'Working…', 'İşleniyor…') : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

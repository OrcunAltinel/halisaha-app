'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  team: { name: string; description: string | null }
  onSave: (name: string, description: string) => Promise<void>
  onClose: () => void
  loading: boolean
}

export default function EditTeamModal({ team, onSave, onClose, loading }: Props) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description ?? '')
  const { locale } = useLocale()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await onSave(name.trim(), description.trim())
  }

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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{t(locale, 'Edit team', 'Takımı duzenle')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(locale, 'Team name', 'Takım adı')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(locale, 'Description', 'Açıklama')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {t(locale, 'Cancel', 'İptal')}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t(locale, 'Saving…', 'Kaydediliyor…') : t(locale, 'Save', 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function AddTurfForm() {
  const router = useRouter()
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim() || !address.trim() || !price.trim()) {
      setError(t(locale, 'All fields are required.', 'Tüm alanlar zorunludur.'))
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/super-admin/create-turf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, price_per_hour: Number(price) }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.error ?? t(locale, 'Failed to create turf.', 'Saha oluşturulamadı.'))
      return
    }
    router.push(`/admin/${json.turf_id}`)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition"
      >
        {t(locale, '+ Add new turf', '+ Yeni saha ekle')}
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t(locale, 'Add new turf', 'Yeni saha ekle')}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t(locale, 'Turf name', 'Saha adı')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(locale, 'e.g. Kıbrıs Halı Saha', 'ör. Kıbrıs Halı Saha')}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t(locale, 'Address', 'Adres')}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t(locale, 'Full address', 'Tam adres')}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t(locale, 'Price per hour (TL)', 'Saatlik ücret (TL)')}
          </label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button
          onClick={() => { setOpen(false); setName(''); setAddress(''); setPrice(''); setError(null) }}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {t(locale, 'Cancel', 'İptal')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition disabled:opacity-50"
        >
          {saving ? t(locale, 'Creating…', 'Oluşturuluyor…') : t(locale, 'Create turf', 'Sahayı oluştur')}
        </button>
      </div>
    </div>
  )
}

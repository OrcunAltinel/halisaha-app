'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage({ text: t(locale, 'Password must be at least 8 characters.', 'Şifre en az 8 karakter olmalı.'), isError: true })
      return
    }

    if (password !== confirm) {
      setMessage({ text: t(locale, 'Passwords do not match.', 'Şifreler eşleşmiyor.'), isError: true })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ text: error.message, isError: true })
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold">{t(locale, 'Password updated', 'Şifre güncellendi')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t(locale, 'Your password has been changed. Redirecting you to login…', 'Şifren degistirildi. Giriş sayfasina yönlendiriliyorsun…')}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold">{t(locale, 'Set a new password', 'Yeni bir şifre belirle')}</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t(locale, 'New password', 'Yeni şifre')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none"
          minLength={8}
          required
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t(locale, 'Confirm new password', 'Yeni şifreyi doğrula')}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none"
          minLength={8}
          required
        />
      </div>

      {message && (
        <p className={`mb-4 text-sm ${message.isError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black dark:bg-white px-4 py-3 text-white dark:text-black"
      >
        {loading ? t(locale, 'Updating...', 'Güncelleniyor...') : t(locale, 'Update password', 'Şifreyi güncelle')}
      </button>
    </form>
  )
}

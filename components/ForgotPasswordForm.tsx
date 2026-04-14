'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function ForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setMessage({ text: error.message, isError: true })
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h1 className="mb-2 text-2xl font-bold">{t(locale, 'Check your email', 'E-postanı kontrol et')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          <strong>{email}</strong> {t(locale, 'is registered, you&apos;ll receive a password reset link shortly.', 'kayıtlıysa birazdan şifre sıfırlama bağlantısı alacaksın.')}
        </p>
        <a href="/login" className="mt-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
          {t(locale, 'Back to login', 'Giriş ekranına dön')}
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-2 text-2xl font-bold">{t(locale, 'Reset your password', 'Şifreni sıfırla')}</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {t(locale, 'Enter your email and we&apos;ll send you a link to set a new password.', 'E-posta adresini gir, sana yeni şifre belirlemen için bir bağlantı gönderelim.')}
      </p>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t(locale, 'Email', 'E-posta')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none"
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
        {loading ? t(locale, 'Sending...', 'Gönderiliyor...') : t(locale, 'Send reset link', 'Sıfırlama bağlantısı gönder')}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <a href="/login" className="hover:text-black dark:hover:text-white">
          {t(locale, 'Back to login', 'Giriş ekranına dön')}
        </a>
      </p>
    </form>
  )
}

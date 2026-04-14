'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    // Only allow internal redirects to prevent open-redirect attacks
    const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/'
    router.push(safeRedirect)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleLogin}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold">{t(locale, 'Log in', 'Giriş yap')}</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t(locale, 'Email', 'E-posta')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t(locale, 'Password', 'Şifre')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          required
        />
      </div>

      {message && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{message}</p>}

      <div className="mb-4 text-right">
        <a href="/forgot-password" className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
          {t(locale, 'Forgot password?', 'Şifreni mi unuttun?')}
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-800 px-4 py-3 font-semibold text-white hover:bg-green-900 transition-colors disabled:opacity-50"
      >
        {loading ? t(locale, 'Logging in...', 'Giriş yapiliyor...') : t(locale, 'Log in', 'Giriş yap')}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function SignupForm() {
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t(locale, 'Passwords do not match.', 'Şifreler eşleşmiyor.'))
      return
    }

    if (username.trim().length < 3) {
      setError(t(locale, 'Username must be at least 3 characters.', 'Kullanıcı adı en az 3 karakter olmalı.'))
      return
    }

    setLoading(true)

    // Check username availability (works without auth)
    const { data: available, error: checkError } = await supabase.rpc(
      'check_username_available',
      { p_username: username.trim() }
    )

    if (checkError) {
      setError(checkError.message)
      setLoading(false)
      return
    }

    if (!available) {
      setError(t(locale, 'That username is already taken.', 'Bu kullanıcı adı zaten alınmış.'))
      setLoading(false)
      return
    }

    // Create account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Insert profile (user is now signed in)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({ user_id: data.user.id, username: username.trim() })

      if (profileError) {
        setError(
          profileError.message.includes('user_profiles_username_unique')
            ? t(locale, 'That username was just taken. Please choose another.', 'Bu kullanıcı adı az once alindi. Lütfen başka bir tane seç.')
            : profileError.message
        )
        setLoading(false)
        return
      }
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'Account created!', 'Hesap oluşturuldu!')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t(locale, 'Welcome,', 'Hoş geldin,')} <strong>{username}</strong>. {t(locale, 'You can now', 'Artik')} {' '}
          <a href="/login" className="underline text-gray-900 dark:text-white">{t(locale, 'log in', 'giriş yap')}</a>.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSignup}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'Sign up', 'Kayıt ol')}</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t(locale, 'Username', 'Kullanıcı adı')}
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={30}
          required
          placeholder={t(locale, 'e.g. streetking99', 'örnek: streetking99')}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t(locale, 'Email', 'E-posta')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t(locale, 'Password', 'Şifre')}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t(locale, 'Confirm password', 'Şifreyi doğrula')}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-800 px-4 py-3 font-semibold text-white hover:bg-green-900 transition-colors disabled:opacity-50"
      >
        {loading ? t(locale, 'Creating account…', 'Hesap oluşturuluyor…') : t(locale, 'Sign up', 'Kayıt ol')}
      </button>
    </form>
  )
}

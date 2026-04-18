'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function SignupForm() {
  const supabase = createSupabaseBrowserClient()
  const { locale } = useLocale()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
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
      setError(t(locale, 'Passwords do not match.', 'Sifreler eslesmiyor.'))
      return
    }

    if (name.trim().length < 2) {
      setError(t(locale, 'Name must be at least 2 characters.', 'Ad en az 2 karakter olmali.'))
      return
    }

    if (surname.trim().length < 2) {
      setError(t(locale, 'Surname must be at least 2 characters.', 'Soyad en az 2 karakter olmali.'))
      return
    }

    setLoading(true)

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
        .insert({ user_id: data.user.id, name: name.trim(), surname: surname.trim() })

      if (profileError) {
        setError(profileError.message)
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
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'Account created!', 'Hesap olusturuldu!')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t(locale, 'Welcome,', 'Hos geldin,')} <strong>{name}</strong>. {t(locale, 'You can now', 'Artik')} {' '}
          <a href="/login" className="underline text-gray-900 dark:text-white">{t(locale, 'log in', 'giris yap')}</a>.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSignup}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t(locale, 'Sign up', 'Kayit ol')}</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t(locale, 'Name', 'Ad')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
            placeholder={t(locale, 'e.g. Ali', 'orn. Ali')}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t(locale, 'Surname', 'Soyad')}
          </label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            minLength={2}
            maxLength={50}
            required
            placeholder={t(locale, 'e.g. Yilmaz', 'orn. Yilmaz')}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
          />
        </div>
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
          {t(locale, 'Password', 'Sifre')}
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
          {t(locale, 'Confirm password', 'Sifreyi dogrula')}
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
        {loading ? t(locale, 'Creating account...', 'Hesap olusturuluyor...') : t(locale, 'Sign up', 'Kayit ol')}
      </button>
    </form>
  )
}

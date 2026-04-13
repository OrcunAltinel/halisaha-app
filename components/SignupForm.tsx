'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function SignupForm() {
  const supabase = createSupabaseBrowserClient()
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
      setError('Passwords do not match.')
      return
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
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
      setError('That username is already taken.')
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
            ? 'That username was just taken. Please choose another.'
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
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Account created!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome, <strong>{username}</strong>. You can now{' '}
          <a href="/login" className="underline text-gray-900 dark:text-white">log in</a>.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSignup}
      className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Sign up</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={30}
          required
          placeholder="e.g. streetking99"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
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
          Password
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
          Confirm password
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
        {loading ? 'Creating account…' : 'Sign up'}
      </button>
    </form>
  )
}

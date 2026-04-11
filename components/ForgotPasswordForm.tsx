'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient()
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
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="text-gray-600">
          If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link shortly.
        </p>
        <a href="/login" className="mt-6 inline-block text-sm text-gray-500 hover:text-black">
          Back to login
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="mb-2 text-2xl font-bold">Reset your password</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
          required
        />
      </div>

      {message && (
        <p className={`mb-4 text-sm ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 text-white"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        <a href="/login" className="hover:text-black">
          Back to login
        </a>
      </p>
    </form>
  )
}

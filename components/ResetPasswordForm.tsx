'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters.', isError: true })
      return
    }

    if (password !== confirm) {
      setMessage({ text: 'Passwords do not match.', isError: true })
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
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold">Password updated</h1>
        <p className="text-gray-600">Your password has been changed. Redirecting you to login…</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold">Set a new password</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
          minLength={8}
          required
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
          minLength={8}
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
        {loading ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}

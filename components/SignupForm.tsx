'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Account created. You can now log in.')
    setLoading(false)
    router.push('/login')
  }

  return (
    <form
      onSubmit={handleSignup}
      className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold">Sign up</h1>

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

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
          required
        />
      </div>

      {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 text-white"
      >
        {loading ? 'Creating account...' : 'Sign up'}
      </button>
    </form>
  )
}
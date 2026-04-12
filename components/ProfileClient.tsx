'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'

type Props = {
  userId: string
  currentEmail: string
  currentUsername: string | null
  team: { id: string; name: string } | null
  joinedAt: string
}

const supabase = createSupabaseBrowserClient()

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400'

const saveBtn = (loading: boolean, label = 'Save changes') =>
  `mt-1 rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 transition ${loading ? 'opacity-60' : ''}`

export default function ProfileClient({
  userId,
  currentEmail,
  currentUsername,
  team,
  joinedAt,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()

  // Username
  const [username, setUsername] = useState(currentUsername ?? '')
  const [usernameLoading, setUsernameLoading] = useState(false)

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleUsernameSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed || trimmed.length < 3) {
      showToast('Username must be at least 3 characters.', 'error')
      return
    }
    setUsernameLoading(true)

    // Check availability (skip check if unchanged)
    if (trimmed.toLowerCase() !== (currentUsername ?? '').toLowerCase()) {
      const { data: available } = await supabase.rpc('check_username_available', {
        p_username: trimmed,
      })
      if (!available) {
        showToast('That username is already taken.', 'error')
        setUsernameLoading(false)
        return
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, username: trimmed }, { onConflict: 'user_id' })

    setUsernameLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Username updated!', 'success')
    router.refresh()
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newEmail.trim()
    if (!trimmed) return
    setEmailLoading(true)

    const { error } = await supabase.auth.updateUser({ email: trimmed })
    setEmailLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Confirmation sent to your new email address. Click the link to complete the change.', 'success')
    setNewEmail('')
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error')
      return
    }
    setPasswordLoading(true)

    // Verify current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (signInError) {
      showToast('Current password is incorrect.', 'error')
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Password updated!', 'success')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const memberSince = new Date(joinedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="mb-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Member since {memberSince}
          </p>
        </div>

        {/* Username */}
        <Section title="Username">
          {!currentUsername && (
            <p className="mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              You have not set a username yet. Other users see your email address instead.
            </p>
          )}
          <form onSubmit={handleUsernameSave}>
            <Field label="Username">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                placeholder="e.g. streetking99"
                className={inputClass}
              />
            </Field>
            <button type="submit" disabled={usernameLoading} className={saveBtn(usernameLoading)}>
              {usernameLoading ? 'Saving…' : currentUsername ? 'Update username' : 'Set username'}
            </button>
          </form>
        </Section>

        {/* Email */}
        <Section title="Email address">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Current: <span className="font-medium text-gray-900 dark:text-white">{currentEmail}</span>
          </p>
          <form onSubmit={handleEmailSave}>
            <Field label="New email address">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className={inputClass}
              />
            </Field>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              A confirmation link will be sent to the new address.
            </p>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className={saveBtn(emailLoading, 'Change email')}
            >
              {emailLoading ? 'Sending…' : 'Change email'}
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section title="Password">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Field label="Current password">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className={saveBtn(passwordLoading, 'Change password')}
            >
              {passwordLoading ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </Section>

        {/* Team */}
        <Section title="Your Team">
          {team ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{team.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">You are a member of this team</p>
              </div>
              <Link
                href="/my-team"
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Manage
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You are not part of any team yet.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/teams/create"
                  className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
                >
                  Create a team
                </Link>
                <Link
                  href="/teams"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Browse teams
                </Link>
              </div>
            </div>
          )}
        </Section>

      </div>
    </main>
  )
}

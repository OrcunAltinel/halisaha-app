'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import { getIntlLocale, t } from '@/lib/locale'
import { useLocale } from '@/components/LocaleProvider'

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

const saveBtn = (loading: boolean) =>
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
  const { locale } = useLocale()

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
      showToast(t(locale, 'Username must be at least 3 characters.', 'Kullanıcı adı en az 3 karakter olmalı.'), 'error')
      return
    }
    setUsernameLoading(true)

    // Check availability (skip check if unchanged)
    if (trimmed.toLowerCase() !== (currentUsername ?? '').toLowerCase()) {
      const { data: available } = await supabase.rpc('check_username_available', {
        p_username: trimmed,
      })
      if (!available) {
        showToast(t(locale, 'That username is already taken.', 'Bu kullanıcı adı zaten alınmış.'), 'error')
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
    showToast(t(locale, 'Username updated!', 'Kullanıcı adı güncellendi!'), 'success')
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
    showToast(t(locale, 'Confirmation sent to your new email address. Click the link to complete the change.', 'Yeni e-posta adresine onay bağlantısı gönderildi. Değişikliği tamamlamak için bağlantıya tıkla.'), 'success')
    setNewEmail('')
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast(t(locale, 'New passwords do not match.', 'Yeni şifreler eşleşmiyor.'), 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast(t(locale, 'Password must be at least 6 characters.', 'Şifre en az 6 karakter olmalı.'), 'error')
      return
    }
    setPasswordLoading(true)

    // Verify current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (signInError) {
      showToast(t(locale, 'Current password is incorrect.', 'Mevcut şifre yanlış.'), 'error')
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(t(locale, 'Password updated!', 'Şifre güncellendi!'), 'success')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const memberSince = new Date(joinedAt).toLocaleDateString(getIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">

        <div className="mb-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t(locale, 'Profile', 'Profil')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {locale === 'tr' ? `${memberSince} tarihinden beri üye` : `Member since ${memberSince}`}
          </p>
        </div>

        {/* Username */}
        <Section title={t(locale, 'Username', 'Kullanıcı adı')}>
          {!currentUsername && (
            <p className="mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              {t(locale, 'You have not set a username yet. Other users see your email address instead.', 'Henüz bir kullanıcı adı belirlemedin. Diğer kullanıcılar bunun yerine e-posta adresini görür.')}
            </p>
          )}
          <form onSubmit={handleUsernameSave}>
            <Field label={t(locale, 'Username', 'Kullanıcı adı')}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                placeholder={t(locale, 'e.g. streetking99', 'örnek: streetking99')}
                className={inputClass}
              />
            </Field>
            <button type="submit" disabled={usernameLoading} className={saveBtn(usernameLoading)}>
              {usernameLoading
                ? t(locale, 'Saving…', 'Kaydediliyor…')
                : currentUsername
                ? t(locale, 'Update username', 'Kullanıcı adını güncelle')
                : t(locale, 'Set username', 'Kullanıcı adı belirle')}
            </button>
          </form>
        </Section>

        {/* Email */}
        <Section title={t(locale, 'Email address', 'E-posta adresi')}>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t(locale, 'Current:', 'Mevcut:')} <span className="font-medium text-gray-900 dark:text-white">{currentEmail}</span>
          </p>
          <form onSubmit={handleEmailSave}>
            <Field label={t(locale, 'New email address', 'Yeni e-posta adresi')}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className={inputClass}
              />
            </Field>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {t(locale, 'A confirmation link will be sent to the new address.', 'Yeni adrese bir onay bağlantısı gönderilecek.')}
            </p>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className={saveBtn(emailLoading)}
            >
              {emailLoading ? t(locale, 'Sending…', 'Gönderiliyor…') : t(locale, 'Change email', 'E-postayı değiştir')}
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section title={t(locale, 'Password', 'Şifre')}>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Field label={t(locale, 'Current password', 'Mevcut şifre')}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label={t(locale, 'New password', 'Yeni şifre')}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <Field label={t(locale, 'Confirm new password', 'Yeni şifreyi doğrula')}>
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
              className={saveBtn(passwordLoading)}
            >
              {passwordLoading ? t(locale, 'Updating…', 'Güncelleniyor…') : t(locale, 'Change password', 'Şifreyi değiştir')}
            </button>
          </form>
        </Section>

        {/* Team */}
        <Section title={t(locale, 'Your Team', 'Takımın')}>
          {team ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{team.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'You are a member of this team', 'Bu takımın bir üyesisin')}</p>
              </div>
              <Link
                href="/my-team"
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {t(locale, 'Manage', 'Yönet')}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t(locale, 'You are not part of any team yet.', 'Henüz herhangi bir takımın parçası değilsin.')}
              </p>
              <div className="flex gap-3">
                <Link
                  href="/teams/create"
                  className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
                >
                  {t(locale, 'Create a team', 'Takım oluştur')}
                </Link>
                <Link
                  href="/teams"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t(locale, 'Browse teams', 'Takımlara göz at')}
                </Link>
              </div>
            </div>
          )}
        </Section>

      </div>
    </main>
  )
}

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
  currentName: string | null
  currentSurname: string | null
  currentPhone: string | null
  team: { id: string; name: string } | null
  joinedAt: string
}

// Name fields are set at signup and cannot be changed.

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
  currentName,
  currentSurname,
  currentPhone,
  team,
  joinedAt,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()

  // Phone
  const [phone, setPhone] = useState(currentPhone ?? '')
  const [phoneLoading, setPhoneLoading] = useState(false)

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handlePhoneSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 10) {
      showToast(t(locale, 'Enter a valid phone number.', 'Gecerli bir telefon numarasi girin.'), 'error')
      return
    }
    setPhoneLoading(true)

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, phone: trimmed }, { onConflict: 'user_id' })

    setPhoneLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(t(locale, 'Phone number saved!', 'Telefon numarasi kaydedildi!'), 'success')
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
    showToast(t(locale, 'Confirmation sent to your new email address. Click the link to complete the change.', 'Yeni e-posta adresine onay baglantisi gonderildi. Degisikligi tamamlamak icin baglantiya tikla.'), 'success')
    setNewEmail('')
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast(t(locale, 'New passwords do not match.', 'Yeni sifreler eslesmiyor.'), 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast(t(locale, 'Password must be at least 6 characters.', 'Sifre en az 6 karakter olmali.'), 'error')
      return
    }
    setPasswordLoading(true)

    // Verify current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (signInError) {
      showToast(t(locale, 'Current password is incorrect.', 'Mevcut sifre yanlis.'), 'error')
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(t(locale, 'Password updated!', 'Sifre guncellendi!'), 'success')
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
          {(currentName || currentSurname) && (
            <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">
              {`${currentName ?? ''} ${currentSurname ?? ''}`.trim()}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {locale === 'tr' ? `${memberSince} tarihinden beri uye` : `Member since ${memberSince}`}
          </p>
        </div>

        {/* Phone */}
        <Section title={t(locale, 'Phone number', 'Telefon numarasi')}>
          {currentPhone && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t(locale, 'Current:', 'Mevcut:')} <span className="font-medium text-gray-900 dark:text-white">{currentPhone}</span>
            </p>
          )}
          <form onSubmit={handlePhoneSave}>
            <Field label={currentPhone ? t(locale, 'Update phone number', 'Telefon numarasini guncelle') : t(locale, 'Add phone number', 'Telefon numarasi ekle')}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t(locale, 'e.g. 05xx xxx xx xx', 'orn. 05xx xxx xx xx')}
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={phoneLoading || !phone.trim()}
              className={saveBtn(phoneLoading)}
            >
              {phoneLoading ? t(locale, 'Saving...', 'Kaydediliyor...') : t(locale, 'Save phone number', 'Telefon numarasini kaydet')}
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
              {t(locale, 'A confirmation link will be sent to the new address.', 'Yeni adrese bir onay baglantisi gonderilecek.')}
            </p>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className={saveBtn(emailLoading)}
            >
              {emailLoading ? t(locale, 'Sending...', 'Gonderiliyor...') : t(locale, 'Change email', 'E-postayi degistir')}
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section title={t(locale, 'Password', 'Sifre')}>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Field label={t(locale, 'Current password', 'Mevcut sifre')}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label={t(locale, 'New password', 'Yeni sifre')}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <Field label={t(locale, 'Confirm new password', 'Yeni sifreyi dogrula')}>
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
              {passwordLoading ? t(locale, 'Updating...', 'Guncelleniyor...') : t(locale, 'Change password', 'Sifreyi degistir')}
            </button>
          </form>
        </Section>

        {/* Team */}
        <Section title={t(locale, 'Your Team', 'Takimin')}>
          {team ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{team.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'You are a member of this team', 'Bu takimin bir uyesisin')}</p>
              </div>
              <Link
                href="/my-team"
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {t(locale, 'Manage', 'Yonet')}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t(locale, 'You are not part of any team yet.', 'Henuz herhangi bir takimin parcasi degilsin.')}
              </p>
              <div className="flex gap-3">
                <Link
                  href="/teams/create"
                  className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
                >
                  {t(locale, 'Create a team', 'Takim olustur')}
                </Link>
                <Link
                  href="/teams"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t(locale, 'Browse teams', 'Takimlara goz at')}
                </Link>
              </div>
            </div>
          )}
        </Section>

      </div>
    </main>
  )
}

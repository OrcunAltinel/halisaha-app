'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  token: string
  teamId: string
  teamName: string
  isLoggedIn: boolean
}

const supabase = createSupabaseBrowserClient()

export default function JoinViaInviteClient({ token, teamName, isLoggedIn }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(locale, 'Log in or create an account to join this team.', 'Bu takıma katılmak için giriş yap veya hesap oluştur.')}
        </p>
        <Link
          href={`/login?redirect=/teams/join/${token}`}
          className="block w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
        >
          {t(locale, 'Log in to join', 'Katılmak için giriş yap')}
        </Link>
        <Link
          href={`/signup?redirect=/teams/join/${token}`}
          className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {t(locale, 'Sign up', 'Kayıt ol')}
        </Link>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="space-y-4">
        <p className="text-green-600 dark:text-green-400 font-semibold">
          {locale === 'tr' ? `${teamName} takımına katıldin!` : `You joined ${teamName}!`}
        </p>
        <Link
          href="/my-team"
          className="block w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
        >
          {t(locale, 'Go to My Team', 'Takımıma git')}
        </Link>
      </div>
    )
  }

  async function handleJoin() {
    setLoading(true)
    const { error } = await supabase.rpc('join_via_invite', { p_token: token })
    setLoading(false)
    if (error) {
      showToast(
        error.message === 'already_in_a_team' ? t(locale, 'You are already in a team.', 'Zaten bir takımın üyesisin.') :
        error.message === 'invalid_token' ? t(locale, 'This invite link is no longer valid.', 'Bu davet bağlantısı artık geçerli değil.') :
        error.message,
        'error'
      )
      return
    }
    setJoined(true)
    showToast(locale === 'tr' ? `${teamName} takımına hoş geldin!` : `Welcome to ${teamName}!`, 'success')
    router.refresh()
  }

  return (
    <div className="space-y-3 mt-6">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
      >
        {loading ? t(locale, 'Joining…', 'Katılım yapılıyor…') : locale === 'tr' ? `${teamName} takımına katıl` : `Join ${teamName}`}
      </button>
      <Link
        href="/teams"
        className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        {t(locale, 'Browse other teams instead', 'Bunun yerine diğer takımlara bak')}
      </Link>
    </div>
  )
}

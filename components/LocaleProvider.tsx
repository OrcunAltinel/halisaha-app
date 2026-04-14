'use client'

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { LOCALE_COOKIE, type Locale } from '@/lib/locale'

type LocaleContextValue = {
  locale: Locale
  setLocale: (nextLocale: Locale) => void
  isSwitching: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [isSwitching, startTransition] = useTransition()

  useEffect(() => {
    document.documentElement.lang = locale === 'tr' ? 'tr' : 'en'
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isSwitching,
      setLocale: (nextLocale) => {
        if (nextLocale === locale) return
        setLocaleState(nextLocale)
        document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
        document.documentElement.lang = nextLocale === 'tr' ? 'tr' : 'en'
        startTransition(() => {
          router.refresh()
        })
      },
    }),
    [isSwitching, locale, router]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return value
}

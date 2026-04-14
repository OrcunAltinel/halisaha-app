import { cookies } from 'next/headers'

import { LOCALE_COOKIE, resolveLocale, type Locale } from '@/lib/locale'

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
}


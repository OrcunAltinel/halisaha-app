export const supportedLocales = ['en', 'tr'] as const

export type Locale = (typeof supportedLocales)[number]

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'halisaha-locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'tr'
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function getLocaleFromCookieString(cookieString: string): Locale {
  const cookieMatch = cookieString
    .split('; ')
    .find((item) => item.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1]

  return resolveLocale(cookieMatch)
}

export function t(locale: Locale, en: string, tr: string): string {
  return locale === 'tr' ? tr : en
}

export function getIntlLocale(locale: Locale): string {
  return locale === 'tr' ? 'tr-TR' : 'en-GB'
}

export function translateStatus(locale: Locale, status: string): string {
  switch (status) {
    case 'accepted':
      return locale === 'tr' ? 'Kabul edildi' : 'Accepted'
    case 'approved':
      return locale === 'tr' ? 'Onaylandı' : 'Approved'
    case 'cancelled':
      return locale === 'tr' ? 'İptal edildi' : 'Cancelled'
    case 'completed':
      return locale === 'tr' ? 'Tamamlandı' : 'Completed'
    case 'confirmed':
      return locale === 'tr' ? 'Onaylandı' : 'Confirmed'
    case 'pending':
      return locale === 'tr' ? 'Beklemede' : 'Pending'
    case 'rejected':
      return locale === 'tr' ? 'Reddedildi' : 'Rejected'
    default:
      return status
  }
}

export function translatePaymentStatus(locale: Locale, status: string): string {
  switch (status) {
    case 'paid':
      return locale === 'tr' ? 'Ödendi' : 'Paid'
    case 'pending':
      return locale === 'tr' ? 'Ödeme bekleniyor' : 'Pending'
    case 'refunded':
      return locale === 'tr' ? 'İade edildi' : 'Refunded'
    case 'unpaid':
      return locale === 'tr' ? 'Ödenmedi' : 'Unpaid'
    default:
      return status
  }
}

export function translateCancellationActor(locale: Locale, actor: string): string {
  switch (actor) {
    case 'admin':
      return locale === 'tr' ? 'yönetici' : 'admin'
    case 'user':
      return locale === 'tr' ? 'kullanıcı' : 'user'
    default:
      return actor
  }
}

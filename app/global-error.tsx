'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DEFAULT_LOCALE, getLocaleFromCookieString, t, type Locale } from '@/lib/locale'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale] = useState<Locale>(() =>
    typeof document === 'undefined'
      ? DEFAULT_LOCALE
      : getLocaleFromCookieString(document.cookie)
  )

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang={locale}>
      <body className="bg-gray-200 dark:bg-gray-950 text-black dark:text-white">
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold">{t(locale, 'Something went wrong', 'Bir şeyler ters gitti')}</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400 text-sm">
              {t(locale, 'An unexpected error occurred. You can try again or go back to the homepage.', 'Beklenmeyen bir hata oluştu. Tekrar deneyebilir veya ana sayfaya dönebilirsin.')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="rounded-xl bg-black dark:bg-white px-6 py-3 text-sm text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {t(locale, 'Try again', 'Tekrar dene')}
              </button>
              <Link
                href="/"
                className="rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                {t(locale, 'Go to homepage', 'Ana sayfaya dön')}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}

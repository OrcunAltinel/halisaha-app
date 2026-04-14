'use client'

import Link from 'next/link'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

export default function Footer() {
  const year = new Date().getFullYear()
  const { locale } = useLocale()

  return (
    <footer className="border-t-2 border-green-500 bg-white dark:bg-gray-900 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {year} Halisaha. {t(locale, 'All rights reserved.', 'Tüm haklari saklidir.')}
        </p>
        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/terms" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {t(locale, 'Terms of Service', 'Kullanim Kosullari')}
          </Link>
          <Link href="/privacy" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {t(locale, 'Privacy Policy', 'Gizlilik Politikasi')}
          </Link>
        </div>
      </div>
    </footer>
  )
}

import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import ThemeProvider from '@/components/ThemeProvider'
import { LocaleProvider } from '@/components/LocaleProvider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: t(locale, 'Halisaha — Book Astroturf Pitches in Cyprus', 'Halisaha — Kıbrıs’ta Halı Saha Rezervasyonu'),
    description: t(
      locale,
      'Find and book astroturf football pitches across Cyprus.',
      'Kıbrıs genelindeki halı sahaları keşfedin ve kolayca rezervasyon yapın.'
    ),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()

  return (
    <html lang={locale} suppressHydrationWarning className="bg-gray-200 dark:bg-gray-950">
      <body className="bg-gray-200 dark:bg-gray-950 text-black dark:text-white">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <ToastProvider>
              <Navbar />
              {children}
              <Footer />
              <Analytics />
              <SpeedInsights />
            </ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

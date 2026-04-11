import './globals.css'
import Navbar from '@/components/Navbar'
import ToastProvider from '@/components/ToastProvider'

export const metadata = {
  title: 'Halisaha App',
  description: 'Astroturf booking platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-black">
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
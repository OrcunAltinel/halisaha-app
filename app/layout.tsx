import './globals.css'
import Navbar from '@/components/Navbar'

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
        <Navbar />
        {children}
      </body>
    </html>
  )
}
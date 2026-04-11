import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-500">© {year} Halisaha. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-black">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

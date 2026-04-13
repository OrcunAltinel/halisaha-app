import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-green-500 bg-white dark:bg-gray-900 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">© {year} Halisaha. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/terms" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

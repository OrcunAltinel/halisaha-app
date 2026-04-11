'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-gray-500 text-sm">
          An unexpected error occurred. You can try again or go back to the homepage.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-black px-6 py-3 text-sm text-white hover:bg-gray-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            Go to homepage
          </a>
        </div>
      </div>
    </main>
  )
}

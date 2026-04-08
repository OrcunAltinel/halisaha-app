'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { isUserAdmin } from '@/lib/admin'
import { usePathname, useRouter } from 'next/navigation'

type UserInfo = {
  email?: string
}

const supabase = createSupabaseBrowserClient()

export default function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (user) {
        setUser({ email: user.email })
        const adminCheck = await isUserAdmin(user.id)
        if (mounted) setIsAdmin(adminCheck)
      } else {
        setUser(null)
        setIsAdmin(false)
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser({ email: session.user.email })
        const adminCheck = await isUserAdmin(session.user.id)
        if (mounted) setIsAdmin(adminCheck)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.push('/')
    router.refresh()
  }

  const displayName = user?.email ? user.email.split('@')[0] : 'User'

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black">
            Halisaha
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium hover:text-black ${
                pathname === '/' ? 'text-black' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/hali-sahalar"
              className={`text-sm font-medium hover:text-black ${
                pathname.startsWith('/hali-sahalar') ? 'text-black' : 'text-gray-700'
              }`}
            >
              Astroturfs
            </Link>
            <Link
              href="/my-reservations"
              className={`text-sm font-medium hover:text-black ${
                pathname.startsWith('/my-reservations') ? 'text-black' : 'text-gray-700'
              }`}
            >
              My Reservations
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium hover:text-black ${
                  pathname.startsWith('/admin') ? 'text-black' : 'text-gray-700'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : user ? (
            <>
              <div className="flex items-center gap-2 rounded-full border bg-gray-50 px-4 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                  U
                </div>
                <div className="text-sm font-medium text-gray-800">{displayName}</div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl border px-4 py-2 text-sm font-medium">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
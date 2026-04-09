"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function resolveSession(session: Session | null) {
      try {
        if (session?.user) {
          setEmail(session.user.email ?? null);

          // Inline admin check — no external dependency that could fail silently
          const { data, error } = await supabase
            .from("astroturf_admins")
            .select("id")
            .eq("user_id", session.user.id)
            .limit(1);

          if (error) {
            console.error("[Navbar] admin check error:", error);
            if (mounted) setIsAdmin(false);
          } else {
            if (mounted) setIsAdmin((data?.length ?? 0) > 0);
          }
        } else {
          if (mounted) {
            setEmail(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error("[Navbar] resolveSession error:", err);
        if (mounted) {
          setEmail(session?.user?.email ?? null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Initial session fetch
    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) console.error("[Navbar] getSession error:", error);
        if (!mounted) return;
        await resolveSession(session);
      } catch (err) {
        console.error("[Navbar] initial fetch error:", err);
        if (mounted) setLoading(false);
      }
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        resolveSession(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-gray-900 font-medium"
        : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + primary links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Halisaha
            </Link>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>
              <Link href="/hali-sahalar" className={linkClass("/hali-sahalar")}>
                Astroturfs
              </Link>
              {email && (
                <Link
                  href="/my-reservations"
                  className={linkClass("/my-reservations")}
                >
                  My Reservations
                </Link>
              )}
              {email && isAdmin && (
                <Link href="/admin" className={linkClass("/admin")}>
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right: Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
            ) : email ? (
              <>
                <span className="text-sm text-gray-600 max-w-[160px] truncate">
                  {email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm px-3 py-1.5 text-gray-700 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Link href="/" className={linkClass("/")}>
              Home
            </Link>
            <Link href="/hali-sahalar" className={linkClass("/hali-sahalar")}>
              Astroturfs
            </Link>
            {email && (
              <Link
                href="/my-reservations"
                className={linkClass("/my-reservations")}
              >
                My Reservations
              </Link>
            )}
            {email && isAdmin && (
              <Link href="/admin" className={linkClass("/admin")}>
                Admin
              </Link>
            )}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : email ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600 truncate">
                    {email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 w-fit"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="text-sm px-3 py-1.5 text-gray-700"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm px-3 py-1.5 rounded-md bg-gray-900 text-white"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
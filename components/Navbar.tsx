"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useTheme } from "@/components/ThemeProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span>{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function resolveSession(session: Session | null) {
      try {
        if (session?.user) {
          setEmail(session.user.email ?? null);

          const { data: adminRows, error: adminError } = await supabase
            .from("astroturf_admins")
            .select("id")
            .eq("user_id", session.user.id)
            .limit(1);

          if (adminError) {
            console.error("[Navbar] admin check error:", adminError);
            if (mounted) setIsAdmin(false);
          } else {
            if (mounted) setIsAdmin((adminRows?.length ?? 0) > 0);
          }

          const { data: superRows, error: superError } = await supabase
            .from("super_admins")
            .select("user_id")
            .eq("user_id", session.user.id)
            .limit(1);

          if (superError) {
            console.error("[Navbar] super admin check error:", superError);
            if (mounted) setIsSuperAdmin(false);
          } else {
            if (mounted) setIsSuperAdmin((superRows?.length ?? 0) > 0);
          }
        } else {
          if (mounted) {
            setEmail(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        }
      } catch (err) {
        console.error("[Navbar] resolveSession error:", err);
        if (mounted) {
          setEmail(session?.user?.email ?? null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("[Navbar] getSession error:", error);
        if (!mounted) return;
        await resolveSession(session);
      } catch (err) {
        console.error("[Navbar] initial fetch error:", err);
        if (mounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    router.push("/");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-gray-900 dark:text-white font-medium"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + primary links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900 dark:text-white">
              Halisaha
            </Link>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/" className={linkClass("/")}>Home</Link>
              <Link href="/hali-sahalar" className={linkClass("/hali-sahalar")}>Astroturfs</Link>
              {email && <Link href="/my-reservations" className={linkClass("/my-reservations")}>My Reservations</Link>}
              {email && <Link href="/my-applications" className={linkClass("/my-applications")}>My Applications</Link>}
              <Link href="/teams" className={linkClass("/teams")}>Teams</Link>
              {email && <Link href="/my-team" className={linkClass("/my-team")}>My Team</Link>}
              {email && isAdmin && <Link href="/admin" className={linkClass("/admin")}>Admin</Link>}
              {email && isSuperAdmin && <Link href="/admin/applications" className={linkClass("/admin/applications")}>Review Applications</Link>}
            </div>
          </div>

          {/* Right: Theme toggle + Auth area */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : email ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm px-3 py-1.5 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 text-gray-700 dark:text-gray-300"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <Link href="/" className={linkClass("/")}>Home</Link>
            <Link href="/hali-sahalar" className={linkClass("/hali-sahalar")}>Astroturfs</Link>
            {email && <Link href="/my-reservations" className={linkClass("/my-reservations")}>My Reservations</Link>}
            {email && <Link href="/my-applications" className={linkClass("/my-applications")}>My Applications</Link>}
            <Link href="/teams" className={linkClass("/teams")}>Teams</Link>
            {email && <Link href="/my-team" className={linkClass("/my-team")}>My Team</Link>}
            {email && isAdmin && <Link href="/admin" className={linkClass("/admin")}>Admin</Link>}
            {email && isSuperAdmin && <Link href="/admin/applications" className={linkClass("/admin/applications")}>Review Applications</Link>}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ) : email ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-fit"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300">Log in</Link>
                  <Link href="/signup" className="text-sm px-3 py-1.5 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

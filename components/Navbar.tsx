"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useTheme } from "@/components/ThemeProvider";
import { t } from "@/lib/locale";
import { useLocale } from "@/components/LocaleProvider";

type NavItem = {
  href: string;
  label: string;
  description?: string;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { locale } = useLocale();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? t(locale, "Switch to light mode", "Aydınlık moda geç") : t(locale, "Switch to dark mode", "Karanlık moda geç")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <span>{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}

function LocaleSwitch() {
  const { locale, setLocale, isSwitching } = useLocale();

  return (
    <div className="flex items-center rounded-xl border border-gray-200 p-0.5 dark:border-gray-800">
      {(["en", "tr"] as const).map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            disabled={isSwitching}
            onClick={() => setLocale(option)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              active
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
            aria-label={option === "en" ? "Switch language to English" : "Dili Türkçe yap"}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasApplications, setHasApplications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function resolveSession(session: Session | null) {
      try {
        if (session?.user) {
          setEmail(session.user.email ?? null);

          const { data: profile } = await supabase
            .from("user_profiles")
            .select("name, surname")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const fullName = profile
            ? [profile.name, profile.surname].filter(Boolean).join(' ')
            : null;
          if (mounted) setDisplayName(fullName ?? session.user.email ?? null);

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

          const { data: appRows } = await supabase
            .from("turf_applications")
            .select("id")
            .eq("user_id", session.user.id)
            .limit(1);

          if (mounted) setHasApplications((appRows?.length ?? 0) > 0);
        } else if (mounted) {
          setEmail(null);
          setDisplayName(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setHasApplications(false);
        }
      } catch (err) {
        console.error("[Navbar] resolveSession error:", err);
        if (mounted) {
          setEmail(session?.user?.email ?? null);
          setDisplayName(session?.user?.email ?? null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      resolveSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setEmail(null);
    setDisplayName(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setHasApplications(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const generalItems = useMemo<NavItem[]>(
    () => [
      {
        href: "/",
        label: t(locale, "Home", "Ana Sayfa"),
        description: t(locale, "Start from the homepage", "Ana sayfadan başla"),
      },
      {
        href: "/hali-sahalar",
        label: t(locale, "Astroturfs", "Halı Sahalar"),
        description: t(locale, "Browse and book pitches", "Sahaları keşfet ve rezerve et"),
      },
      {
        href: "/teams",
        label: t(locale, "Teams", "Takımlar"),
        description: t(locale, "Find teams and challenges", "Takımları ve meydan okumaları gör"),
      },
      {
        href: "/tournaments",
        label: t(locale, "Tournaments", "Turnuvalar"),
        description: t(locale, "Join organised competitions", "Organize turnuvalara katıl"),
      },
    ],
    [locale]
  );

  const accountItems = useMemo<NavItem[]>(
    () =>
      email
        ? [
            {
              href: "/my-reservations",
              label: t(locale, "My Reservations", "Rezervasyonlarım"),
              description: t(locale, "Manage your bookings", "Rezervasyonlarını yönet"),
            },
            {
              href: "/my-team",
              label: t(locale, "My Team", "Takımım"),
              description: t(locale, "Team members and requests", "Takım üyeleri ve talepler"),
            },
            ...(hasApplications
              ? [
                  {
                    href: "/my-applications",
                    label: t(locale, "My Applications", "Başvurularım"),
                    description: t(locale, "Track pitch listing requests", "Saha listeleme başvurularını takip et"),
                  },
                ]
              : []),
            {
              href: "/profile",
              label: t(locale, "Profile", "Profil"),
              description: t(locale, "Account settings", "Hesap ayarları"),
            },
          ]
        : [],
    [email, hasApplications, locale]
  );

  const adminItems = useMemo<NavItem[]>(
    () =>
      email
        ? [
            ...(isAdmin
              ? [
                  {
                    href: "/admin",
                    label: t(locale, "Admin Panel", "Yönetim Paneli"),
                    description: t(locale, "Manage your pitches", "Sahalarını yönet"),
                  },
                ]
              : []),
            ...(isSuperAdmin
              ? [
                  {
                    href: "/admin/applications",
                    label: t(locale, "Review Applications", "Başvuruları İncele"),
                    description: t(locale, "Approve pitch applications", "Saha başvurularını onayla"),
                  },
                  {
                    href: "/super-admin",
                    label: t(locale, "Super Admin", "Süper Yönetici"),
                    description: t(locale, "Platform management", "Platform yönetimi"),
                  },
                ]
              : []),
          ]
        : [],
    [email, isAdmin, isSuperAdmin, locale]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <section className="space-y-2">
        <p className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          {title}
        </p>
        <div className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group block rounded-2xl px-4 py-3 transition ${
                  active
                    ? "bg-green-50 text-gray-950 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-white dark:ring-green-800"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/70"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{item.label}</span>
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-gray-300 opacity-0 transition group-hover:opacity-100 dark:bg-gray-600"}`} />
                </span>
                {item.description && (
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={t(locale, "Open navigation", "Navigasyonu aç")}
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-green-800 text-sm font-black text-white shadow-sm shadow-green-900/20">
                H
              </span>
              <span className="truncate text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Halisaha<span className="text-green-500">.</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/list-your-pitch"
              className="hidden rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-900/30 sm:inline-flex"
            >
              {t(locale, "List your pitch", "Sahanı listele")}
            </Link>
            <LocaleSwitch />
            <ThemeToggle />

            {loading ? (
              <div className="hidden h-10 w-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 sm:block" />
            ) : email ? (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="hidden max-w-[180px] truncate rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 sm:block"
              >
                {displayName}
              </button>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t(locale, "Log in", "Giriş yap")}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {t(locale, "Sign up", "Kayıt ol")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label={t(locale, "Close navigation", "Navigasyonu kapat")}
          />

          <aside className="relative flex h-full w-[min(420px,92vw)] flex-col border-r border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href="/" className="inline-flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-800 text-sm font-black text-white">
                      H
                    </span>
                    <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                      Halisaha<span className="text-green-500">.</span>
                    </span>
                  </Link>
                  
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              {email ? (
                <div className="mt-5 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                    {t(locale, "Signed in", "Oturum açık")}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {displayName ?? email}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t(locale, "Log in", "Giriş yap")}
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-2xl bg-green-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-900"
                  >
                    {t(locale, "Sign up", "Kayıt ol")}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto p-5">
              {renderNavGroup(t(locale, "Explore", "Keşfet"), generalItems)}
              {renderNavGroup(t(locale, "Account", "Hesap"), accountItems)}
              {renderNavGroup(t(locale, "Management", "Yönetim"), adminItems)}

              <section className="rounded-3xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                <p className="text-sm font-bold text-green-900 dark:text-green-200">
                  {t(locale, "Own a pitch?", "Sahan mı var?")}
                </p>
                <p className="mt-1 text-xs text-green-800/80 dark:text-green-300/80">
                  {t(locale, "List it on the platform and start receiving bookings.", "Platformda listele ve rezervasyon almaya başla.")}
                </p>
                <Link
                  href="/list-your-pitch"
                  className="mt-3 inline-flex rounded-2xl bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
                >
                  {t(locale, "List your pitch", "Sahanı listele")}
                </Link>
              </section>
            </div>

            {email && (
              <div className="border-t border-gray-200 p-5 dark:border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t(locale, "Log out", "Çıkış yap")}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

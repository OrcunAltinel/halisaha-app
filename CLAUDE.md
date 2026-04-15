# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Read the Next.js docs first

This project runs **Next.js 16** with Turbopack. APIs, conventions, and file structure differ from what most training data covers. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev      # Start dev server (Turbopack) at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test suite exists yet.

### Turbopack cache gotcha

If a new file is added while the dev server is already running, Turbopack may cache a "module not found" error and keep returning 404 for that route even after the file exists. Fix: stop the server, delete `.next/`, and restart.

```bash
# PowerShell
Stop-Process -Name node -Force
Remove-Item -Recurse -Force .next
npm run dev
```

## Git workflow

Before committing any change, always run the dev server (`npm run dev`) and verify the affected pages look and work correctly in the browser at **http://localhost:3000**. Only commit after confirming the change is visible and correct.

**Always show a summary of all changes to the user before committing or pushing.** List every new file, every modified file, and a plain-English description of what each does. Wait for explicit user approval before running `git commit` or `git push`.

**After implementing any feature, always tell the user exactly where to go to test it.** List the specific URLs and the steps to follow — e.g. "Go to `/my-reservations` → Past tab, click 'Leave a review' on a confirmed booking." Do not assume the user knows where a new feature lives.

Commit and push to GitHub at every logical checkpoint — after each feature, fix, or self-contained change. Never batch unrelated changes into one commit. Commit messages must be clean and human-written in style: conventional commit format (`feat:`, `fix:`, `refactor:`, etc.), no mention of AI tools, no "Co-authored-by" lines, no heredoc/EOF syntax — always use plain `git commit -m "..."`. Push immediately after committing so work is never only local.

## Architecture

### Supabase client rules — critical

There are two clients and they must never be mixed up:

| Context | Import |
|---|---|
| Server Components, Route Handlers | `createSupabaseServerClient()` from `lib/supabase.ts` — async, reads cookies |
| Client Components (`'use client'`) | `createSupabaseBrowserClient()` from `lib/supabase-browser.ts` — singleton |

The old `import { supabase } from '@/lib/supabase'` pattern is intentionally broken and throws a clear error. Never use it.

`proxy.ts` (project root, not `middleware.ts`) runs on every request and refreshes the auth session cookie. This is what keeps the server and client in sync. Do not rename or remove it.

### Auth flow

Supabase uses PKCE. Email confirmation and password reset links both arrive as `?code=` query params. The Route Handler at `app/auth/callback/route.ts` exchanges the code for a session (writing auth cookies onto the redirect response) and redirects to `?next=`. All new auth email links must use this callback route.

### Server vs. client rendering

- Most pages that need auth data are **server components** — they `await createSupabaseServerClient()` directly and pass data down as props. RLS is enforced automatically because queries run as the authenticated user.
- Pages with heavy interactivity (admin turf dashboard, booking flow) are `'use client'` and fetch their own data via the browser client after mounting.
- The pattern in `app/astroturf/[id]/page.tsx` (server component, passes slots to `<TurfCalendar>` client component) is the preferred hybrid approach.

### Role system

Three tiers, all enforced at the database level via RLS:

1. **Regular users** — can browse, book, cancel own reservations
2. **Turf admins** — rows in `astroturf_admins` table; `lib/admin.ts` exposes `getAdminTurfs()` and `isUserAdmin()`
3. **Super admins** — rows in `super_admins` table; can approve/reject turf applications, manage ALL turfs, and create turfs instantly

The Navbar reads role state client-side after mount. Super admin gating in server components queries `super_admins` directly.

#### Super admin page (`/super-admin`)

- Lists every turf on the platform with name, address, price, and active/inactive status
- "Manage" links to `/admin/[turfId]` — the admin page auto-grants super admin access via `super_admin_grant_access` RPC if not already in `astroturf_admins`
- "+ Add new turf" form creates a turf instantly (no application review) via `super_admin_create_turf` RPC
- Purple "Super Admin" button appears in the navbar to the right of Log out, visible only to super admins

#### Supabase SQL functions (in `supabase/`)

All files in `supabase/` must be run manually in the Supabase SQL Editor before the features work:

| File | Functions | Purpose |
|---|---|---|
| `supabase/admin_block_slot.sql` | `admin_reserve_slot` | Admin instantly confirms a walk-in reservation for a time slot |
| `supabase/super_admin.sql` | `super_admin_grant_access`, `super_admin_create_turf` | Super admin access to all turfs + instant turf creation |

#### Admin walk-in booking

Turf admins can click any available (`+`) cell in the weekly reservation calendar to open a "Reserve this slot" modal. They enter the customer's name (stored in `cancellation_reason`), click Confirm, and the slot is instantly marked as confirmed. The customer name shows in the detail panel as "Customer: [name]". The reservation can be cancelled using the standard cancel flow.

## Pending work — remind the user

> **TODO (remind user when relevant):** The turf/pitch profile page is missing **contact information** (phone number, WhatsApp, email) and **photos/images** for each pitch. These should be added to the turf creation form (both the application flow and the super-admin instant-create form at `/super-admin`), stored in the `astroturfs` table, and displayed on the public turf page (`/astroturf/[id]`). The `ImageUploader` component and `TurfImageGallery` component already exist and are ready to be wired up.

### Data flow for booking

`time_slots` rows are created in bulk by turf admins. A reservation locks a slot (`is_available = false`). Approval/rejection flips the reservation status. Cancellation restores slot availability. All destructive mutations go through `SECURITY DEFINER` RPCs that re-check ownership.

### Key shared utilities

- `lib/date-helpers.ts` — `todayStr()`, `dateBucket()`, `formatDateLabel()`, `formatTime()`, `effectiveStatus()`. Use these everywhere dates are displayed or compared; never inline date logic.
- `components/TurfCalendar.tsx` — 14-day horizontal date strip + hourly slot grid. Accepts slots as props from the server component parent.
- `components/TurfImageGallery.tsx` — desktop collage + mobile carousel + keyboard-navigable lightbox. Accepts `image_urls: string[]`.
- `components/ImageUploader.tsx` — client-side image compression via `browser-image-compression` before upload to Supabase Storage.

### URL-driven state

Search and filter state on `/hali-sahalar` lives entirely in URL params (no `useState` for filters). `TurfFilterBar` writes to the URL; the page server component reads `searchParams`. This keeps filtered views shareable and server-rendered.

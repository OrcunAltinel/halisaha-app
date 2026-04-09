// This file now exports a factory for creating a server-side Supabase client
// that reads auth cookies in Next.js App Router server components.
//
// IMPORTANT: This file is for server components only. For client components,
// use `lib/supabase-browser.ts`.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Components we cannot set cookies. The middleware handles
          // session refresh. This try/catch swallows the expected error when
          // this client is used in a pure Server Component context.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // No-op: called from a Server Component that can't set cookies.
          }
        },
      },
    }
  )
}

// Backwards-compatible export: any existing `import { supabase } from '@/lib/supabase'`
// will now throw a clear error telling you to use createSupabaseServerClient instead.
// This surfaces places in your codebase that still use the old pattern so you can
// migrate them deliberately rather than silently breaking.
export const supabase = new Proxy(
  {},
  {
    get() {
      throw new Error(
        '[lib/supabase] The default `supabase` export has been removed. ' +
          'In Server Components, use `await createSupabaseServerClient()`. ' +
          'In Client Components, use `createSupabaseBrowserClient()` from `@/lib/supabase-browser`.'
      )
    },
  }
) as never
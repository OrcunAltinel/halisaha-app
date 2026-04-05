import { createClient } from '@supabase/supabase-js'

let supabaseBrowserClient: ReturnType<typeof createClient> | null = null

export function createSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return supabaseBrowserClient
}
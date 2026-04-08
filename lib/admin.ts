import { createSupabaseBrowserClient } from './supabase-browser'

export type AdminTurf = {
  astroturf_id: string
  role: string
  astroturfs: {
    id: string
    name: string
    address: string
    price_per_hour: number
  } | null
}

/**
 * Returns the list of turfs the given user manages.
 * Empty array means the user is not an admin of anything.
 */
export async function getAdminTurfs(userId: string): Promise<AdminTurf[]> {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('astroturf_admins')
    .select(`
      astroturf_id,
      role,
      astroturfs ( id, name, address, price_per_hour )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('getAdminTurfs error:', error)
    return []
  }

  return (data || []) as unknown as AdminTurf[]
}

/**
 * Quick boolean check: is this user an admin of at least one turf?
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()

  const { count, error } = await supabase
    .from('astroturf_admins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('isUserAdmin error:', error)
    return false
  }

  return (count || 0) > 0
}
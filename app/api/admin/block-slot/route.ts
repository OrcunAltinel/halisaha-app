import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { time_slot_id, astroturf_id, customer_name } = await request.json()
  if (!time_slot_id || !astroturf_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('admin_reserve_slot', {
    p_time_slot_id: time_slot_id,
    p_astroturf_id: astroturf_id,
    p_admin_user_id: user.id,
    p_customer_name: customer_name?.trim() || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, reservation_id: data })
}

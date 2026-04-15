import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, address, price_per_hour } = await request.json()
  if (!name?.trim() || !address?.trim() || price_per_hour == null) {
    return NextResponse.json({ error: 'Name, address and price are required' }, { status: 400 })
  }
  const price = Number(price_per_hour)
  if (isNaN(price) || price < 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('super_admin_create_turf', {
    p_super_admin_user_id: user.id,
    p_name: name.trim(),
    p_address: address.trim(),
    p_price_per_hour: price,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, turf_id: data })
}

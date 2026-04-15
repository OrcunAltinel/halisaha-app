import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ turfId: string }> }
) {
  const { turfId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('astroturf_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('astroturf_id', turfId)
    .maybeSingle()

  if (adminError || !adminRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deleteSteps = [
    () => supabase.from('reviews').delete().eq('astroturf_id', turfId),
    () => supabase.from('reservations').delete().eq('astroturf_id', turfId),
    () => supabase.from('time_slots').delete().eq('astroturf_id', turfId),
    () => supabase.from('astroturf_admins').delete().eq('astroturf_id', turfId),
    () => supabase.from('astroturfs').delete().eq('id', turfId),
  ]

  for (const runStep of deleteSteps) {
    const { error } = await runStep()
    if (error) {
      return NextResponse.json(
        { error: error.message ?? 'Failed to delete turf' },
        { status: 400 }
      )
    }
  }

  return NextResponse.json({ ok: true })
}

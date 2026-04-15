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

  const { error: deactivateError } = await supabase
    .from('astroturfs')
    .update({ is_active: false })
    .eq('id', turfId)

  if (deactivateError) {
    return NextResponse.json(
      { error: deactivateError.message ?? 'Failed to deactivate turf' },
      { status: 400 }
    )
  }

  const { error: unlinkError } = await supabase
    .from('astroturf_admins')
    .delete()
    .eq('astroturf_id', turfId)

  if (unlinkError) {
    return NextResponse.json(
      { error: unlinkError.message ?? 'Failed to remove admin access' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}

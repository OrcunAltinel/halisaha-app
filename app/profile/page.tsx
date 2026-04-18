import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import ProfileClient from '@/components/ProfileClient'

type TeamMembership = {
  team_id: string
  teams: { id: string; name: string } | null
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/profile')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, surname')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, teams ( id, name )')
    .eq('user_id', user.id)
    .maybeSingle()

  const team = (membership as TeamMembership | null)?.teams ?? null

  return (
    <ProfileClient
      userId={user.id}
      currentEmail={user.email ?? ''}
      currentName={profile?.name ?? null}
      currentSurname={profile?.surname ?? null}
      team={team}
      joinedAt={user.created_at}
    />
  )
}

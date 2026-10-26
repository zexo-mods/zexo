'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateAccountSettings(formData: FormData) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect('/login')
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const displayName = String(formData.get('display_name') ?? '').trim().slice(0, 60)
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim()
  if (!/^[a-z0-9_]{3,24}$/.test(username)) redirect('/settings?error=Username%20must%20be%203-24%20characters%20using%20letters%2C%20numbers%20or%20underscores')
  if (avatarUrl && (!avatarUrl.startsWith('https://') || avatarUrl.length > 500)) redirect('/settings?error=Avatar%20URL%20must%20be%20a%20valid%20HTTPS%20link')
  const { error } = await supabase.from('profiles').upsert({ id: userId, username, display_name: displayName, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) redirect('/settings?error=' + encodeURIComponent(error.message))
  redirect('/settings?saved=1')
}

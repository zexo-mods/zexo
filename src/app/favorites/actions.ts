'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function removeFavorite(formData: FormData) {
  const addonId = String(formData.get('addon_id') ?? '')
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect('/login')
  if (!addonId) redirect('/favorites')
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('add_on_id', addonId)
  if (error) redirect('/favorites?error=' + encodeURIComponent(error.message))
  redirect('/favorites?removed=1')
}

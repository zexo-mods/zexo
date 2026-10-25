'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect('/login')
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  if (!role) redirect('/creator?error=Admin%20access%20required')
  return supabase
}

export async function moderateAddOn(formData: FormData) {
  const supabase = await requireAdmin()
  const addOnId = String(formData.get('add_on_id') ?? '')
  const action = String(formData.get('action') ?? '')
  const reason = String(formData.get('reason') ?? '')
  const { error } = await supabase.rpc('admin_moderate_add_on', {
    p_add_on_id: addOnId,
    p_action: action,
    p_reason: reason,
  })
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  redirect('/admin?updated=1')
}

export async function reviewFile(formData: FormData) {
  const supabase = await requireAdmin()
  const fileId = String(formData.get('file_id') ?? '')
  const status = String(formData.get('scan_status') ?? '')
  const { error } = await supabase.rpc('admin_set_file_scan_status', {
    p_file_id: fileId,
    p_scan_status: status,
  })
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  redirect('/admin?updated=1')
}

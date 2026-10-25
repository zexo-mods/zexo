'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function downloadAddOn(formData: FormData) {
  const addonId = String(formData.get('addon_id') ?? '')
  const fileId = String(formData.get('file_id') ?? '')
  if (!addonId || !fileId) redirect('/explore?error=Invalid%20download%20request')

  const supabase = await createClient()
  const { data: file, error } = await supabase.from('add_on_files')
    .select('id,storage_path,file_name,add_ons!inner(id,status)')
    .eq('id', fileId)
    .eq('add_on_id', addonId)
    .eq('scan_status', 'clean')
    .maybeSingle()

  const relatedAddon = file
    ? (Array.isArray(file.add_ons) ? file.add_ons[0] : file.add_ons)
    : null

  if (error || !file || !relatedAddon || relatedAddon.status !== 'published') {
    redirect('/explore?error=File%20is%20not%20available')
  }

  const admin = createAdminClient()
  const { data: signed, error: signedError } = await admin.storage
    .from('mod-files')
    .createSignedUrl(file.storage_path, 300, { download: file.file_name })

  if (signedError || !signed?.signedUrl) {
    redirect('/explore?error=' + encodeURIComponent(signedError?.message ?? 'Could not prepare download'))
  }

  // Download analytics must never block a valid file download.
  const { data: claimsData } = await supabase.auth.getClaims()
  await admin.from('downloads').insert({
    user_id: claimsData?.claims?.sub ?? null,
    add_on_id: addonId,
    file_id: fileId,
  })

  redirect(signed.signedUrl)
}

export async function reportAddOn(formData: FormData) {
  const addonId = String(formData.get('addon_id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 120)
  const details = String(formData.get('details') ?? '').trim().slice(0, 2000)
  if (!addonId || !reason) redirect('/explore?error=Choose%20a%20report%20reason')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?error=Sign%20in%20to%20report%20content')

  const { error } = await supabase.from('reports').insert({
    reporter_id: userId,
    add_on_id: addonId,
    reason,
    details,
  })
  if (error) redirect('/explore?error=' + encodeURIComponent(error.message))
  redirect('/add-ons/' + String(formData.get('slug') ?? '') + '?reported=1')
}

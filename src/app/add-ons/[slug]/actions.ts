'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function downloadAddOn(formData: FormData) {
  const addonId = String(formData.get('addon_id') ?? '')
  const fileId = String(formData.get('file_id') ?? '')
  const supabase = await createClient()
  const { data: file, error } = await supabase.from('add_on_files')
    .select('id,storage_path,add_ons!inner(id,status)')
    .eq('id', fileId)
    .eq('add_on_id', addonId)
    .eq('scan_status','clean')
    .maybeSingle()
  if (error || !file || !file.add_ons || (file.add_ons as {status:string}).status !== 'published') redirect('/explore?error=File%20is%20not%20available')

  const admin = createAdminClient()
  const { data: signed, error: signedError } = await admin.storage.from('mod-files').createSignedUrl(file.storage_path, 60)
  if (signedError || !signed?.signedUrl) redirect('/explore?error=Could%20not%20prepare%20download')

  const { data: claimsData } = await supabase.auth.getClaims()
  const admin = createAdminClient()
  const { error: recordError } = await admin.from('downloads').insert({
    user_id: claimsData?.claims?.sub ?? null,
    add_on_id: addonId,
    file_id: fileId,
  })
  if (recordError) redirect('/explore?error=' + encodeURIComponent(recordError.message))
  redirect(signed.signedUrl)
}

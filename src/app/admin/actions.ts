'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const userClient = await createClient()
  const { data } = await userClient.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect('/login')
  const { data: role } = await userClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  if (!role) redirect('/creator?error=Admin%20access%20required')
  return { admin: createAdminClient(), userId }
}

export async function moderateAddOn(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const addOnId = String(formData.get('add_on_id') ?? '')
  const action = String(formData.get('action') ?? '')
  const reason = String(formData.get('reason') ?? '').slice(0, 2000)
  const statusByAction: Record<string, string> = {
    request_changes: 'changes_requested',
    publish: 'published',
    reject: 'rejected',
    copyright: 'rejected',
    suspend: 'suspended',
    restore: 'published',
  }
  const nextStatus = statusByAction[action]
  if (!nextStatus || !addOnId) redirect('/admin?error=Invalid%20moderation%20action')

  const { data: addon, error: addonError } = await admin.from('add_ons').select('id,creator_id,published_at').eq('id', addOnId).maybeSingle()
  if (addonError || !addon) redirect('/admin?error=Add-on%20not%20found')

  if (action === 'publish') {
    // Publishing is allowed only after an administrator has explicitly reviewed
    // and marked at least one attached file as clean.
    const { data: cleanFiles, error: filesError } = await admin.from('add_on_files')
      .select('id').eq('add_on_id', addOnId).eq('scan_status', 'clean').limit(1)
    if (filesError) redirect('/admin?error=' + encodeURIComponent(filesError.message))
    if (!cleanFiles?.length) redirect('/admin?error=Cannot%20publish%20until%20an%20admin%20manually%20approves%20at%20least%20one%20clean%20file')
  }

  const { error: updateError } = await admin.from('add_ons').update({
    status: nextStatus,
    moderation_feedback: action === 'copyright' ? (reason ? 'Copyright concern: ' + reason : 'Copyright concern: submission flagged for possible copyright infringement.') : reason || null,
    published_at: nextStatus === 'published' ? addon.published_at ?? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', addOnId)
  if (updateError) redirect('/admin?error=' + encodeURIComponent(updateError.message))

  const { error: eventError } = await admin.from('moderation_events').insert({ admin_id: userId, add_on_id: addOnId, action, reason })
  if (eventError) redirect('/admin?error=' + encodeURIComponent('Status saved, but event log failed: ' + eventError.message))
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action, target_type: 'add_on', target_id: addOnId, metadata: { reason } })

  const messages: Record<string, string> = {
    request_changes: 'The review team requested changes to your add-on.',
    publish: 'Your add-on is now published on ZEXO.',
    reject: 'Your add-on submission was rejected.',
    copyright: 'Your add-on submission was rejected because of a copyright concern. Please contact support if you believe this is a mistake.',
    suspend: 'Your add-on has been suspended.',
    restore: 'Your add-on has been restored.',
  }
  await admin.from('notifications').insert({ user_id: addon.creator_id, title: 'Add-on review update', message: messages[action] })
  redirect('/admin?updated=1')
}

export async function reviewFile(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const fileId = String(formData.get('file_id') ?? '')
  const status = String(formData.get('scan_status') ?? '')
  if (!fileId || !['clean', 'quarantined', 'rejected'].includes(status)) redirect('/admin?error=Invalid%20file%20review%20status')
  const { error } = await admin.from('add_on_files').update({ scan_status: status }).eq('id', fileId)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action: 'file_scan_' + status, target_type: 'add_on_file', target_id: fileId, metadata: {} })
  redirect('/admin?updated=1')
}

export async function moderateReport(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const reportId = String(formData.get('report_id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!reportId || !['reviewing', 'resolved', 'dismissed'].includes(status)) redirect('/admin?error=Invalid%20report%20decision')
  const { error } = await admin.from('reports').update({ status }).eq('id', reportId)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action: 'report_' + status, target_type: 'report', target_id: reportId, metadata: {} })
  redirect('/admin?updated=1')
}


export async function updateAdminAddOn(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const id = String(formData.get('add_on_id') ?? '')
  const title = String(formData.get('title') ?? '').trim().slice(0, 100)
  const description = String(formData.get('description') ?? '').trim().slice(0, 5000)
  const shortDescription = String(formData.get('short_description') ?? '').trim().slice(0, 240)
  const status = String(formData.get('status') ?? '')
  if (!id || title.length < 3 || description.length < 10 || !['draft','pending_review','published','rejected','suspended','changes_requested'].includes(status)) redirect('/admin?error=Invalid%20mod%20details')
  const { data: existing } = await admin.from('add_ons').select('status').eq('id', id).maybeSingle()
  if (!existing) redirect('/admin?error=Mod%20not%20found')
  if (status === 'published') {
    const { data: cleanFiles } = await admin.from('add_on_files').select('id').eq('add_on_id', id).eq('scan_status', 'clean').limit(1)
    if (!cleanFiles?.length) redirect('/admin?error=Cannot%20publish%20without%20a%20manually%20approved%20clean%20file')
  }
  const { error } = await admin.from('add_ons').update({
    title, description, short_description: shortDescription, status,
    published_at: status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action: 'admin_edit_add_on', target_type: 'add_on', target_id: id, metadata: { title, status } })
  redirect('/admin?updated=1#manage')
}

export async function deleteAdminAddOn(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const id = String(formData.get('add_on_id') ?? '')
  if (!id) redirect('/admin?error=Invalid%20mod')
  const { data: addon } = await admin.from('add_ons').select('id,title').eq('id', id).maybeSingle()
  if (!addon) redirect('/admin?error=Mod%20not%20found')
  const [{ data: files }, { data: images }] = await Promise.all([
    admin.from('add_on_files').select('storage_path').eq('add_on_id', id),
    admin.from('add_on_images').select('image_path').eq('add_on_id', id),
  ])
  const filePaths = (files ?? []).map(file => file.storage_path)
  const imagePaths = (images ?? []).map(image => image.image_path)
  if (filePaths.length) await admin.storage.from('mod-files').remove(filePaths)
  if (imagePaths.length) await admin.storage.from('mod-images').remove(imagePaths)
  await admin.from('favorites').delete().eq('add_on_id', id)
  await admin.from('downloads').delete().eq('add_on_id', id)
  await admin.from('reports').delete().eq('add_on_id', id)
  await admin.from('moderation_events').delete().eq('add_on_id', id)
  await admin.from('add_on_files').delete().eq('add_on_id', id)
  await admin.from('add_on_images').delete().eq('add_on_id', id)
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action: 'admin_delete_add_on', target_type: 'add_on', target_id: id, metadata: { title: addon.title } })
  const { error } = await admin.from('add_ons').delete().eq('id', id)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  redirect('/admin?deleted=1#manage')
}


export async function setCreatorVerification(formData: FormData) {
  const { admin, userId } = await requireAdmin()
  const profileId = String(formData.get('profile_id') ?? '')
  const status = String(formData.get('verification_status') ?? '')
  if (!profileId || !['verified', 'unverified'].includes(status)) redirect('/admin?error=Invalid%20creator%20verification%20request')
  const { data: profile, error: lookupError } = await admin.from('creator_profiles').select('id,user_id,display_name').eq('id', profileId).maybeSingle()
  if (lookupError || !profile) redirect('/admin?error=Creator%20profile%20not%20found')
  const { error } = await admin.from('creator_profiles').update({ verification_status: status }).eq('id', profileId)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  await admin.from('admin_audit_logs').insert({ admin_id: userId, action: status === 'verified' ? 'creator_verified' : 'creator_verification_revoked', target_type: 'creator_profile', target_id: profileId, metadata: { user_id: profile.user_id, display_name: profile.display_name } })
  redirect('/admin?updated=1#verification')
}

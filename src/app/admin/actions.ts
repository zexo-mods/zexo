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
    // Publishing is the administrator's explicit approval after manual file review.
    // Mark the submission's attached files clean as part of that approval.
    const { data: files, error: filesError } = await admin.from('add_on_files').select('id').eq('add_on_id', addOnId)
    if (filesError || !files?.length) redirect('/admin?error=Cannot%20publish%20because%20this%20submission%20has%20no%20uploaded%20file')
    const { error: scanError } = await admin.from('add_on_files').update({ scan_status: 'clean' }).eq('add_on_id', addOnId)
    if (scanError) redirect('/admin?error=' + encodeURIComponent(scanError.message))
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

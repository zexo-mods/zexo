'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const allowedTypes = new Set(['mcpack','mcaddon','mcworld','mctemplate','zip'])

export async function submitAddOn(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const shortDescription = String(formData.get('short_description') ?? '').trim()
  const categoryValue = String(formData.get('category_id') ?? '')
  const version = String(formData.get('version') ?? '1.0.0').trim()
  const minecraftVersion = String(formData.get('minecraft_version') ?? '').trim()
  const file = formData.get('file')

  if (title.length < 3 || description.length < 10 || !(file instanceof File) || file.size < 1) {
    redirect('/creator?error=Please%20complete%20the%20form%20and%20choose%20a%20pack%20file')
  }
  if (file.size > 100 * 1024 * 1024) redirect('/creator?error=File%20must%20be%20100MB%20or%20smaller')

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowedTypes.has(extension)) redirect('/creator?error=Allowed%20files%3A%20mcpack%2C%20mcaddon%2C%20mcworld%2C%20mctemplate%2C%20zip')

  const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'addon'
  const slug = slugBase + '-' + crypto.randomUUID().slice(0, 8)
  const { data: addon, error: insertError } = await supabase.from('add_ons').insert({
    creator_id: userId,
    category_id: categoryValue ? Number(categoryValue) : null,
    title,
    slug,
    short_description: shortDescription,
    description,
    version,
    minecraft_versions: minecraftVersion ? [minecraftVersion] : [],
    status: 'draft',
  }).select('id').single()

  if (insertError || !addon) redirect('/creator?error=' + encodeURIComponent(insertError?.message ?? 'Could not create submission'))

  const path = userId + '/' + addon.id + '/' + crypto.randomUUID() + '.' + extension
  const { error: uploadError } = await supabase.storage.from('mod-files').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) {
    redirect('/creator?error=' + encodeURIComponent('Upload failed: ' + uploadError.message))
  }

  const { error: fileError } = await supabase.from('add_on_files').insert({
    add_on_id: addon.id,
    storage_path: path,
    file_name: file.name,
    file_type: extension,
    file_size: file.size,
    file_version: version,
  })
  if (fileError) {
    await supabase.storage.from('mod-files').remove([path])
    redirect('/creator?error=' + encodeURIComponent('File record failed: ' + fileError.message))
  }

  const { error: submitError } = await supabase.from('add_ons').update({ status: 'pending_review' }).eq('id', addon.id)
  if (submitError) redirect('/creator?error=' + encodeURIComponent(submitError.message))
  redirect('/creator?submitted=1')
}

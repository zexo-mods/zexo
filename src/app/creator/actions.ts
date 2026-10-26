'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createDraftAddOn(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return { error: 'Please sign in again.' }

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const shortDescription = String(formData.get('short_description') ?? '').trim()
  const categoryValue = String(formData.get('category_id') ?? '')
  const version = String(formData.get('version') ?? '1.0.0').trim()
  const minecraftVersion = String(formData.get('minecraft_version') ?? '').trim()

  if (title.length < 3 || description.length < 10) return { error: 'Title must be at least 3 characters and description at least 10 characters.' }
  const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'addon'
  const slug = slugBase + '-' + crypto.randomUUID().slice(0, 8)
  const { data: addon, error } = await supabase.from('add_ons').insert({
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

  if (error || !addon) return { error: error?.message ?? 'Could not create submission.' }
  return { id: addon.id }
}


export async function updateCreatorAddOn(formData: FormData) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login')
  const id = String(formData.get('add_on_id') ?? '')
  const title = String(formData.get('title') ?? '').trim().slice(0, 100)
  const shortDescription = String(formData.get('short_description') ?? '').trim().slice(0, 240)
  const description = String(formData.get('description') ?? '').trim().slice(0, 5000)
  const version = String(formData.get('version') ?? '1.0.0').trim().slice(0, 40)
  if (!id || title.length < 3 || description.length < 10) redirect('/creator?error=Please%20check%20the%20title%20and%20description')
  const admin = createAdminClient()
  const { data: owned } = await admin.from('add_ons').select('id,status').eq('id', id).eq('creator_id', userId).maybeSingle()
  if (!owned) redirect('/creator?error=Creation%20not%20found%20or%20not%20owned%20by%20you')
  const { error } = await admin.from('add_ons').update({
    title, short_description: shortDescription, description, version,
    status: owned.status === 'published' ? 'pending_review' : owned.status,
    published_at: owned.status === 'published' ? null : undefined,
    moderation_feedback: null, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('creator_id', userId)
  if (error) redirect('/creator?error=' + encodeURIComponent(error.message))
  redirect('/creator?updated=1')
}

export async function deleteCreatorAddOn(formData: FormData) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login')
  const id = String(formData.get('add_on_id') ?? '')
  if (!id) redirect('/creator?error=Invalid%20creation')
  const admin = createAdminClient()
  const { data: addon } = await admin.from('add_ons').select('id,title').eq('id', id).eq('creator_id', userId).maybeSingle()
  if (!addon) redirect('/creator?error=Creation%20not%20found%20or%20not%20owned%20by%20you')
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
  await admin.from('add_on_files').delete().eq('add_on_id', id)
  await admin.from('add_on_images').delete().eq('add_on_id', id)
  const { error } = await admin.from('add_ons').delete().eq('id', id).eq('creator_id', userId)
  if (error) redirect('/creator?error=' + encodeURIComponent(error.message))
  redirect('/creator?deleted=1')
}

'use server'

import { createClient } from '@/lib/supabase/server'

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

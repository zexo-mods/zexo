import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getZexoBucket } from '@/lib/r2'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub
    if (!userId) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

    const form = await request.formData()
    const addonId = String(form.get('addOnId') ?? '')
    const kind = String(form.get('kind') ?? '')
    const file = form.get('file')
    if (!/^[0-9a-f-]{36}$/i.test(addonId) || !(file instanceof File) || !file.size) {
      return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: addon } = await admin.from('add_ons').select('id').eq('id', addonId).eq('creator_id', userId).maybeSingle()
    if (!addon) return NextResponse.json({ error: 'Creation not found or not owned by you.' }, { status: 403 })

    const isPack = kind === 'pack'
    const allowedTypes = isPack
      ? ['mcpack', 'mcaddon', 'mcworld', 'mctemplate', 'zip']
      : ['png', 'jpg', 'jpeg', 'webp']
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const maxBytes = isPack ? 100 * 1024 * 1024 : kind === 'logo' ? 5 * 1024 * 1024 : 8 * 1024 * 1024
    if (!['pack', 'logo', 'screenshot'].includes(kind) || !allowedTypes.includes(extension) || file.size > maxBytes) {
      return NextResponse.json({ error: 'File type or size is not allowed.' }, { status: 400 })
    }
    if (!isPack && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Images must be PNG, JPG or WEBP.' }, { status: 400 })
    }

    const folder = isPack ? 'files' : 'images'
    const key = folder + '/' + userId + '/' + addonId + '/' + (kind === 'logo' ? 'logo/' : kind === 'screenshot' ? 'screenshots/' : '') + crypto.randomUUID() + '.' + (extension === 'jpeg' ? 'jpg' : extension)
    await getZexoBucket().put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    })
    return NextResponse.json({ path: key })
  } catch (error) {
    console.error('ZEXO R2 upload failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 500 })
  }
}

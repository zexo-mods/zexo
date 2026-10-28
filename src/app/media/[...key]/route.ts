import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getZexoBucket } from '@/lib/r2'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params
  const key = segments.join('/')
  if (!key.startsWith('images/') || key.includes('..') || key.length > 700) return new Response('Not found', { status: 404 })

  const admin = createAdminClient()
  const [{ data: addonByThumb }, { data: imageRow }] = await Promise.all([
    admin.from('add_ons').select('id,creator_id,status').eq('thumbnail_path', key).maybeSingle(),
    admin.from('add_on_images').select('add_on_id,add_ons!inner(creator_id,status)').eq('image_path', key).maybeSingle(),
  ])
  const related = imageRow ? (Array.isArray(imageRow.add_ons) ? imageRow.add_ons[0] : imageRow.add_ons) : null
  const ownerId = addonByThumb?.creator_id ?? related?.creator_id
  const published = addonByThumb?.status === 'published' || related?.status === 'published'
  if (!published) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub
    if (!userId || userId !== ownerId) {
      if (!userId) return new Response('Not found', { status: 404 })
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
      if (!role) return new Response('Not found', { status: 404 })
    }
  }

  const object = await getZexoBucket().get(key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers({ 'Cache-Control': published ? 'public, max-age=3600' : 'private, no-store' })
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(object.body, { headers })
}

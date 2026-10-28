import { createAdminClient } from '@/lib/supabase/admin'
import { getZexoBucket } from '@/lib/r2'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId)) {
    return new Response('Invalid download link.', { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { data: file, error } = await admin
      .from('add_on_files')
      .select('id,storage_path,file_name,scan_status,add_ons!inner(id,status)')
      .eq('id', fileId)
      .maybeSingle()

    const addon = file ? (Array.isArray(file.add_ons) ? file.add_ons[0] : file.add_ons) : null
    if (error || !file || file.scan_status !== 'clean' || !addon || addon.status !== 'published') {
      return new Response('This download is not available. The add-on may be unpublished or the file is not approved.', {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const { data: signed, error: signedError } = await admin.storage
      .from('mod-files')
      .createSignedUrl(file.storage_path, 600, { download: file.file_name })

    if (signedError || !signed?.signedUrl) {
      console.error('ZEXO signed download URL error:', signedError?.message)
      return new Response('Could not prepare this download. Please try again later.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const { error: analyticsError } = await admin.from('downloads').insert({
      add_on_id: addon.id,
      file_id: file.id,
    })
    if (analyticsError) console.error('ZEXO download analytics error:', analyticsError.message)

    return NextResponse.redirect(signed.signedUrl, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('ZEXO download route error:', error)
    return new Response('Download service is temporarily unavailable.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}

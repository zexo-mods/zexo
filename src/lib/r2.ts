import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'

type R2ObjectBody = { body: ReadableStream<Uint8Array>; httpEtag: string; writeHttpMetadata(headers: Headers): void }
type R2BucketLike = {
  put(key: string, value: ReadableStream<Uint8Array> | ArrayBuffer | ArrayBufferView | string, options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } }): Promise<unknown>
  get(key: string): Promise<R2ObjectBody | null>
  delete(keys: string | string[]): Promise<void>
}

export function getZexoBucket() {
  const { env } = getCloudflareContext()
  const bucket = (env as unknown as { ZEXO_BUCKET?: R2BucketLike }).ZEXO_BUCKET
  if (!bucket) throw new Error('ZEXO_BUCKET binding is missing. Check wrangler.jsonc and redeploy.')
  return bucket
}

export function mediaPath(path: string | null | undefined) {
  return path ? '/media/' + path.split('/').map(encodeURIComponent).join('/') : null
}

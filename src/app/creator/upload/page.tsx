import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorUploadForm } from '../upload-form'

export default async function CreatorUploadPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?next=/creator/upload')

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .eq('active', true)
    .order('display_order')

  return (
    <main className="min-h-screen bg-[#080B12] px-3 pb-10 pt-4 text-white sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-3xl">
        <header className="sticky top-0 z-20 -mx-3 mb-5 flex items-center gap-3 border-b border-sky-400/10 bg-[#080B12]/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-8 sm:border-0 sm:bg-transparent sm:px-0">
          <Link href="/creator" aria-label="Back to Creator Studio" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-xl text-sky-300">←</Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[.22em] text-sky-400">ZEXO CREATOR STUDIO</p>
            <h1 className="truncate text-lg font-black sm:text-2xl">Upload a mod</h1>
          </div>
          <Link href="/" className="rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300">Marketplace</Link>
        </header>

        <section className="mb-5 rounded-2xl border border-sky-400/15 bg-gradient-to-br from-sky-400/10 via-[#111827] to-[#080B12] p-4 sm:p-6">
          <h2 className="text-xl font-black sm:text-2xl">Share your creation</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Add your Minecraft Bedrock pack, cover image and screenshots. Your upload stays private until it passes admin review.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-sky-200">
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5">Pack up to 100 MB</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5">10 screenshots max</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5">Admin review</span>
          </div>
        </section>

        <CreatorUploadForm categories={categories ?? []}/>
        <div className="mt-5 text-center">
          <Link href="/creator" className="text-sm font-semibold text-sky-300 hover:text-sky-200">← Back to your Creator Studio</Link>
        </div>
      </div>
    </main>
  )
}

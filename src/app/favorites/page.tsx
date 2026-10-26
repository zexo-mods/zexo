import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { removeFavorite } from './actions'

type FavoriteRow = {
  add_on_id: string
  created_at: string
  addon: null | {
    id: string; title: string; slug: string; short_description: string;
    thumbnail_path: string | null; download_count: number; version: string;
  }
}

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ removed?: string; error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login?next=/favorites')
  const { data, error } = await supabase.from('favorites')
    .select('add_on_id,created_at,addon:add_ons!inner(id,title,slug,short_description,thumbnail_path,download_count,version)')
    .eq('user_id', userId).eq('addon.status', 'published').order('created_at', { ascending: false })
  const rows = (data ?? []) as unknown as FavoriteRow[]

  return <main className="min-h-screen bg-[#080809] px-4 py-7 text-white sm:px-6">
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <Link href="/" className="text-xl font-black italic tracking-widest">ZEXO<span className="text-red-500">.</span></Link>
        <Link href="/settings" className="text-sm text-zinc-400 hover:text-white">Settings</Link>
      </header>
      <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft size={16}/> Back home</Link>
      <div className="mt-7 flex items-end justify-between gap-4">
        <div><p className="text-xs font-black tracking-[.2em] text-red-400">YOUR LIBRARY</p><h1 className="mt-2 text-3xl font-black">Saved favourites</h1><p className="mt-2 text-sm text-zinc-500">Your bookmarked Bedrock creations in one place.</p></div>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">{rows.length} saved</span>
      </div>
      {params.removed && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Removed from your favourites.</p>}
      {(params.error || error) && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{params.error || error?.message}</p>}
      {rows.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{rows.filter(row=>row.addon).map(row=>{
        const item=row.addon!
        const image=item.thumbnail_path ? supabase.storage.from('mod-images').getPublicUrl(item.thumbnail_path).data.publicUrl : null
        return <article key={row.add_on_id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111113]">
          <Link href={'/add-ons/'+item.slug} className="block">
            <div className="relative flex aspect-[1.5] items-center justify-center overflow-hidden bg-gradient-to-br from-red-950 via-zinc-900 to-black">{image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover"/> : <span className="text-4xl font-black text-white/20">Z</span>}</div>
            <div className="p-3"><h2 className="truncate text-sm font-bold">{item.title}</h2><p className="mt-1 line-clamp-2 min-h-8 text-xs text-zinc-500">{item.short_description}</p><p className="mt-2 text-[10px] text-zinc-600">{item.download_count ?? 0} downloads</p></div>
          </Link>
          <form action={removeFavorite} className="px-3 pb-3"><input type="hidden" name="addon_id" value={row.add_on_id}/><button className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:border-red-500/50 hover:text-red-300"><Heart size={13}/> Remove saved</button></form>
        </article>
      })}</div> : <div className="mt-8 rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/50 px-6 py-16 text-center"><Heart size={34} className="mx-auto text-zinc-700"/><h2 className="mt-4 text-lg font-bold">Nothing saved yet</h2><p className="mt-2 text-sm text-zinc-500">Browse the marketplace and save packs you want to revisit.</p><Link href="/explore" className="mt-5 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-bold">Explore marketplace</Link></div>}
    </div>
  </main>
}

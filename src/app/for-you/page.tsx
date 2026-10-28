import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Compass, Download, Flame, Sparkles, Clock3, Search } from 'lucide-react'
import MobileBottomNav from '@/components/mobile-bottom-nav'
import { mediaPath } from '@/lib/r2'

type AddOn = {
  id: string
  title: string
  slug: string
  short_description: string | null
  version: string | null
  download_count: number | null
  thumbnail_path: string | null
  category_id: number | null
  categories?: { name?: string } | null
}

function ModCard({ item, imageUrl, category }: { item: AddOn; imageUrl: string | null; category: string }) {
  return (
    <Link href={'/add-ons/' + item.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111113] transition hover:-translate-y-1 hover:border-red-500/60">
      <div className="relative aspect-[1.55] overflow-hidden bg-gradient-to-br from-zinc-800 to-black">
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-4xl font-black text-zinc-700">Z</div>}
        <span className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/75 px-2 py-1 text-[9px] font-black text-red-200">{category}</span>
      </div>
      <div className="p-3">
        <h2 className="truncate text-sm font-extrabold">{item.title}</h2>
        <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-4 text-zinc-500">{item.short_description || 'Discover this Minecraft Bedrock release.'}</p>
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500"><span>v{item.version || '—'}</span><span className="flex items-center gap-1"><Download size={12}/>{item.download_count ?? 0}</span></div>
      </div>
    </Link>
  )
}

export default async function ForYouPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  let base = supabase.from('add_ons').select('id,title,slug,short_description,version,download_count,thumbnail_path,category_id,categories(name)').eq('status', 'published')
  if (params.q?.trim()) base = base.textSearch('title', params.q.trim(), { type: 'websearch', config: 'english' })
  const [{ data: latest, error }, { data: trending }, { data: categories }] = await Promise.all([
    base.order('published_at', { ascending: false }).limit(24),
    supabase.from('add_ons').select('id,title,slug,short_description,version,download_count,thumbnail_path,category_id,categories(name)').eq('status', 'published').order('download_count', { ascending: false }).limit(12),
    supabase.from('categories').select('id,name,slug').eq('active', true).order('display_order'),
  ])
  const categoryName = (item: AddOn) => {
    const rel = item.categories as { name?: string } | { name?: string }[] | null | undefined
    return (Array.isArray(rel) ? rel[0]?.name : rel?.name) || 'ADD-ON'
  }
  const imageUrl = mediaPath
  const cards = (items: AddOn[] | null | undefined) => (items ?? []).map(item => <ModCard key={item.id} item={item} imageUrl={imageUrl(item.thumbnail_path)} category={categoryName(item)} />)

  return (
    <main className="min-h-screen bg-[#080809] pb-28 text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080809]/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-black italic tracking-tight">Z<span className="text-red-500">E</span>XO<span className="text-red-500">.</span></Link>
          <Link href="/explore" className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:border-red-500/60">Explore all</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex justify-center py-4">
          <div className="inline-flex rounded-full border border-zinc-800 bg-[#141416] p-1">
            <Link href="/" className="rounded-full px-6 py-2 text-xs font-semibold text-zinc-400 hover:text-white">▦ Home</Link>
            <Link href="/for-you" className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(220,38,38,.3)]">✦ For you</Link>
          </div>
        </div>
        <section className="mt-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#24100f] via-[#171719] to-black p-6 sm:p-9">
          <p className="flex items-center gap-2 text-[10px] font-black tracking-[.22em] text-red-300"><Sparkles size={14}/> YOUR ZEXO FEED</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Picked for your next world.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Discover popular downloads and the newest Minecraft Bedrock add-ons, maps, skins and texture packs.</p>
          <form action="/for-you" className="mt-5 flex max-w-xl gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-700 bg-black/40 px-3"><Search size={16} className="shrink-0 text-zinc-500"/><input name="q" defaultValue={params.q} placeholder="Find something for your world..." className="w-full bg-transparent py-3 text-sm outline-none"/></div>
            <button className="rounded-xl bg-red-600 px-5 text-sm font-bold hover:bg-red-500">Search</button>
          </form>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2"><Flame size={18} className="text-orange-400"/><h2 className="text-lg font-black">Trending for you</h2></div>
          {(trending?.length ?? 0) > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{cards(trending as AddOn[])}</div> : <p className="rounded-xl border border-zinc-800 p-6 text-sm text-zinc-500">Popular downloads will appear here as the community downloads more content.</p>}
        </section>
        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-sky-400"/><h2 className="text-lg font-black">{params.q ? 'Search results' : 'Fresh releases'}</h2></div>
          {error ? <p className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">Could not load your feed right now. Please refresh and try again.</p> : (latest?.length ?? 0) > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{cards(latest as AddOn[])}</div> : <div className="rounded-xl border border-zinc-800 p-8 text-center text-sm text-zinc-500">No matching published content yet. Try another search or explore all mods.</div>}
        </section>
        <section className="mt-9">
          <div className="mb-4 flex items-center gap-2"><Compass size={18} className="text-red-400"/><h2 className="text-lg font-black">Explore categories</h2></div>
          <div className="flex flex-wrap gap-2">{(categories ?? []).map(c => <Link key={c.id} href={'/explore?category=' + c.slug} className="rounded-full border border-zinc-800 bg-[#111113] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-red-500/60 hover:text-white">{c.name}</Link>)}</div>
        </section>
      </div>
      <MobileBottomNav active="explore" />
    </main>
  )
}

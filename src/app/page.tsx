import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Blocks, Compass, Download, Heart, Home, Search, Settings,
  UserCircle, ChevronRight, Layers3, Palette, Shirt,
} from 'lucide-react'

type Pack = {
  id: string
  title: string
  slug: string
  short_description?: string | null
  version?: string | null
  download_count?: number | null
  category_id?: number | null
  thumbnail_path?: string | null
  featured?: boolean | null
}

const categoryMeta = [
  { id: 1, label: 'ADD-ONS', href: '/explore?category=add-ons', icon: Blocks, color: 'text-red-300 border-red-500/50' },
  { id: 3, label: 'WORLD', href: '/explore?category=maps', icon: Compass, color: 'text-sky-300 border-sky-500/50' },
  { id: 5, label: 'SKINS', href: '/explore?category=skins', icon: Shirt, color: 'text-violet-300 border-violet-500/50' },
  { id: 4, label: 'TEXTURES', href: '/explore?category=texture-packs', icon: Palette, color: 'text-emerald-300 border-emerald-500/50' },
]
const sections = [
  { title: 'LATEST MODS', subtitle: 'Fresh ways to change your game', ids: [1, 2, 4], href: '/explore', tone: 'from-emerald-950 via-zinc-900 to-black' },
  { title: 'MOST DOWNLOADED', subtitle: 'Community favourites', ids: [1, 2, 3, 4, 5, 6], href: '/explore?sort=popular', tone: 'from-blue-950 via-zinc-900 to-black', popular: true },
  { title: 'LATEST ADD-ONS', subtitle: 'New mobs, mechanics and more', ids: [1], href: '/explore?category=add-ons', tone: 'from-amber-950 via-zinc-900 to-black' },
  { title: 'LATEST SKINS', subtitle: 'A new look for every adventure', ids: [5], href: '/explore?category=skins', tone: 'from-fuchsia-950 via-zinc-900 to-black' },
  { title: 'LATEST TEXTURES', subtitle: 'Refresh every block and menu', ids: [2, 4], href: '/explore?category=texture-packs', tone: 'from-green-950 via-zinc-900 to-black' },
  { title: 'LATEST WORLD', subtitle: 'Explore somewhere new', ids: [3, 6], href: '/explore?category=worlds', tone: 'from-sky-950 via-zinc-900 to-black' },
]

function PackCard({ item, tone, categoryName, imageUrl }: {
  item: Pack; tone: string; categoryName: string; imageUrl?: string
}) {
  return (
    <Link href={'/add-ons/' + item.slug} className="pack-card group min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101012] transition duration-200 hover:-translate-y-1 hover:border-red-500/60">
      <div className={'pack-art relative flex aspect-[1.55] items-center justify-center overflow-hidden bg-gradient-to-br ' + tone}>
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : (
          <>
            <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '13px 13px' }} />
            <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full border-[14px] border-white/10" />
            <span className="relative max-w-full px-3 text-center text-xl font-black uppercase leading-none tracking-tight text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,.8)] sm:text-2xl">{item.title}</span>
          </>
        )}
        <span className="absolute bottom-2 left-2 rounded-md border border-white/15 bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">{categoryName}</span>
        {item.featured && <span className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-[8px] font-black tracking-wider text-white">FEATURED</span>}
      </div>
      <div className="p-3">
        <h3 className="truncate text-[12px] font-extrabold text-white sm:text-sm">{item.title}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-zinc-500">{item.download_count ?? 0} downloads</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition group-hover:bg-red-600"><Download size={17} strokeWidth={2.8} /></span>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  let addons: Pack[] = []
  let user: { email?: string } | null = null
  const categoryNames: Record<number, string> = { 1: 'ADD-ONS', 2: 'SHADERS', 3: 'MAPS', 4: 'TEXTURES', 5: 'SKINS', 6: 'WORLDS' }
  let imageFor: (item: Pack) => string | undefined = () => undefined
  try {
    const supabase = await createClient()
    imageFor = (item: Pack) => item.thumbnail_path
      ? supabase.storage.from('mod-images').getPublicUrl(item.thumbnail_path).data.publicUrl
      : undefined
    const [{ data: rows }, { data: categories }, { data: { user: currentUser } }] = await Promise.all([
      supabase.from('add_ons').select('id,title,slug,short_description,version,download_count,category_id,thumbnail_path,featured').eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).limit(60),
      supabase.from('categories').select('id,name').eq('active', true),
      supabase.auth.getUser(),
    ])
    addons = (rows ?? []) as Pack[]
    for (const category of categories ?? []) categoryNames[category.id] = category.name.toUpperCase()
    user = currentUser ? { email: currentUser.email } : null
  } catch { /* Keep the storefront visible if the database is temporarily unavailable. */ }

  const featured = addons.find(item => item.featured) ?? addons[0]
  const groups = sections.map(section => ({
    ...section,
    items: (section.popular
      ? [...addons].sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
      : addons.filter(item => section.ids.includes(Number(item.category_id))))
      .slice(0, 6),
  }))

  return (
    <main className="min-h-screen overflow-hidden bg-[#080809] pb-28 text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080809]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/" aria-label="ZEXO home" className="flex h-10 w-12 shrink-0 items-center justify-center text-2xl font-black italic tracking-tighter"><span className="text-red-500">Z</span><span className="text-white">X</span></Link>
          <form action="/explore" className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-full border border-zinc-800 bg-[#171719] px-4 transition focus-within:border-red-500/70">
            <Search size={17} className="shrink-0 text-zinc-500" /><input name="q" placeholder="Search mods..." className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-500" />
          </form>
          <Link href={user ? '/creator' : '/login'} aria-label="Account" className="relative ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-red-600/80 bg-gradient-to-br from-red-950 to-zinc-950"><UserCircle size={23} className="text-red-300" /><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-400" /></Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-center py-4">
          <div className="inline-flex rounded-full border border-zinc-800 bg-[#141416] p-1">
            <Link href="/" className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold shadow-[0_0_18px_rgba(220,38,38,.3)]">▦ Home</Link>
            <Link href="/explore" className="rounded-full px-6 py-2 text-xs font-semibold text-zinc-400 transition hover:text-white">⌂ For you</Link>
          </div>
        </div>

        <section className="featured-hero relative mt-1 min-h-[190px] overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#41472e] via-[#20231c] to-[#090909] p-5 sm:min-h-[260px] sm:p-9">
          {featured && imageFor(featured) && <img src={imageFor(featured)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15" />
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(ellipse at 75% 20%, #d1d5a0 0, transparent 45%),linear-gradient(135deg,transparent 40%,#6c5424 100%)' }} />
          <div className="relative z-10 max-w-xl">
            <p className="text-[9px] font-black tracking-[.28em] text-red-300 sm:text-[10px]">THE BEDROCK ADD-ON HUB</p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[.92] tracking-tight sm:text-6xl">DIVE INTO<br /><span className="text-red-500">NEW WORLDS.</span></h1>
            <p className="mt-3 max-w-sm text-xs leading-5 text-zinc-300 sm:mt-4 sm:text-sm">Discover the best add-ons, textures, maps, skins and worlds made for Minecraft Bedrock.</p>
            <Link href="/explore" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[11px] font-black tracking-wide shadow-[0_8px_28px_rgba(220,38,38,.25)] transition hover:bg-red-500 sm:mt-6 sm:px-5 sm:py-3">EXPLORE CONTENT <ChevronRight size={15} /></Link>
          </div>
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full border-[30px] border-white/5 sm:h-80 sm:w-80" />
          <div className="absolute bottom-4 right-5 hidden text-right sm:block"><p className="text-5xl font-black italic text-white/10">ZEXO</p><p className="text-[9px] font-bold tracking-[.3em] text-white/40">PLAY DIFFERENT</p></div>
        </section>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categoryMeta.map(({ label, href, icon: Icon, color }) => <Link key={label} href={href} className={'inline-flex shrink-0 items-center gap-2 rounded-full border bg-[#101010] px-4 py-2 text-[10px] font-black tracking-wide transition hover:bg-white/5 ' + color}><Icon size={13} />{label}</Link>)}
        </div>

        {groups.map(group => (
          <section key={group.title} className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><h2 className="text-[13px] font-black tracking-[.16em]">{group.title}</h2><p className="mt-1 text-[10px] text-zinc-600">{group.subtitle}</p></div>
              <Link href={group.href} className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-400 transition hover:text-red-400">MORE <ChevronRight size={13} /></Link>
            </div>
            {group.items.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{group.items.map((item, i) => <PackCard key={item.id} item={item} categoryName={categoryNames[Number(item.category_id)] ?? 'ADD-ON'} imageUrl={imageFor(item)} tone={i % 3 === 0 ? group.tone : i % 3 === 1 ? 'from-blue-950 via-zinc-900 to-black' : 'from-purple-950 via-zinc-900 to-black'} />)}</div> : <div className="rounded-2xl border border-zinc-800/80 bg-[#0d0d0e] px-4 py-7 text-center"><Layers3 className="mx-auto text-zinc-700" size={23} /><p className="mt-2 text-xs font-semibold text-zinc-500">New releases are coming soon.</p></div>}
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-zinc-900 px-4 py-8 text-center">
        <p className="text-lg font-black italic tracking-wider">FOLLOW <span className="text-red-500">ZEXO</span></p><p className="mt-2 text-xs text-zinc-500">Join our community for daily updates and exclusive content.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{[['Discord', '/support'], ['Telegram', '/support'], ['YouTube', '/support'], ['X', '/support']].map(([label, href]) => <Link key={label} href={href} className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold transition hover:border-red-500/60">{label}</Link>)}</div>
        <p className="mt-6 text-[10px] text-zinc-600">© ZEXO · Independent community marketplace. Not affiliated with Mojang or Microsoft.</p>
      </footer>

      <nav className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-black/90 p-2 shadow-[0_10px_50px_rgba(0,0,0,.8)] backdrop-blur-2xl">
        <Link href="/" aria-label="Home" className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_22px_rgba(220,38,38,.35)]"><Home size={23} /></Link>
        <Link href="/explore" aria-label="Search" className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800"><Search size={24} /></Link>
        <Link href="/favorites" aria-label="Favorites" className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800"><Heart size={24} /></Link>
        <Link href="/settings" aria-label="Settings" className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800"><Settings size={24} /></Link>
      </nav>
    </main>
  )
}

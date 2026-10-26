import Link from 'next/link'
import { Blocks, Compass, Download, Heart, Home, Search, Settings, Sparkles, UserCircle, ArrowDownToLine, ChevronRight, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

const sections = [
  { title: 'LATEST MODS', category: 'Add-ons', tone: 'from-emerald-900 via-zinc-900 to-black' },
  { title: 'MOST DOWNLOADED', category: 'All', tone: 'from-blue-900 via-zinc-900 to-black' },
  { title: 'LATEST ADD-ONS', category: 'Add-ons', tone: 'from-amber-900 via-zinc-900 to-black' },
  { title: 'LATEST SKINS', category: 'Skins', tone: 'from-fuchsia-900 via-zinc-900 to-black' },
  { title: 'LATEST TEXTURES', category: 'Texture Packs', tone: 'from-green-900 via-zinc-900 to-black' },
  { title: 'LATEST WORLD', category: 'Maps', tone: 'from-sky-900 via-zinc-900 to-black' },
]
const chips = [
  { label: 'ADD-ONS', href: '/explore?category=add-ons', icon: Blocks, color: 'text-amber-300 border-amber-500/60' },
  { label: 'WORLD', href: '/explore?category=maps', icon: Compass, color: 'text-orange-300 border-orange-500/60' },
  { label: 'SKINS', href: '/explore?category=skins', icon: UserCircle, color: 'text-violet-300 border-violet-500/60' },
  { label: 'TEXTURES', href: '/explore?category=texture-packs', icon: Sparkles, color: 'text-emerald-300 border-emerald-500/60' },
]

function PackCard({ item, tone }: { item: { title: string; slug: string; short_description?: string | null; version?: string | null; download_count?: number | null }; tone: string }) {
  return <Link href={'/add-ons/' + item.slug} className="group min-w-0 overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#101010] transition hover:-translate-y-1 hover:border-red-500/60">
    <div className={'relative flex aspect-[1.55] items-center justify-center overflow-hidden bg-gradient-to-br ' + tone}>
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',backgroundSize:'13px 13px'}} />
      <span className="relative px-3 text-center text-2xl font-black uppercase leading-none tracking-tight text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,.8)] sm:text-3xl">{item.title}</span>
      <span className="absolute bottom-2 left-2 rounded-md border border-white/15 bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-200">Add-On</span>
    </div>
    <div className="p-3">
      <h3 className="truncate text-[13px] font-extrabold text-white sm:text-sm">{item.title}</h3>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded-md bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">ADD-ONS</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition group-hover:bg-red-600"><Download size={19} strokeWidth={2.8}/></span>
      </div>
    </div>
  </Link>
}

export default async function HomePage() {
  let publishedCount = 0
  let addons: { id: string; title: string; slug: string; short_description?: string | null; version?: string | null; download_count?: number | null; category_id?: string | null }[] = []
  let user: { email?: string } | null = null
  let isAdmin = false
  try {
    const supabase = await createClient()
    const [{ count }, { data: rows }, { data: { user: currentUser } }] = await Promise.all([
      supabase.from('add_ons').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('add_ons').select('id,title,slug,short_description,version,download_count,category_id').eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).limit(24),
      supabase.auth.getUser(),
    ])
    publishedCount = count ?? 0
    addons = rows ?? []
    user = currentUser ? { email: currentUser.email } : null
    if (currentUser) {
      const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', currentUser.id).eq('role', 'admin').maybeSingle()
      isAdmin = Boolean(adminRole)
    }
  } catch { /* Keep the storefront visible if the database is temporarily unavailable. */ }

  const groups = sections.map((section, index) => ({
    ...section,
    items: index === 1 ? [...addons].sort((a,b)=>(b.download_count ?? 0)-(a.download_count ?? 0)).slice(0,6) : addons.slice(index * 3, index * 3 + 6),
  }))

  return <main className="min-h-screen bg-black pb-28 text-white">
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/90 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Link href="/" aria-label="ZEXO home" className="flex h-11 w-12 shrink-0 items-center justify-center text-xl font-black italic tracking-tighter"><span className="text-red-500">Z</span><span className="text-white">X</span></Link>
        <form action="/explore" className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-zinc-800 bg-[#171719] px-4 focus-within:border-red-500/70">
          <Search size={18} className="shrink-0 text-zinc-500"/><input name="q" placeholder="Search mods..." className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-500"/>
        </form>
        <Link href={user ? '/creator' : '/login'} aria-label="Account" className="relative ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-red-600/80 bg-gradient-to-br from-red-950 to-zinc-950"><UserCircle size={24} className="text-red-300"/><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-400"/></Link>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-center py-4">
        <div className="inline-flex rounded-full border border-zinc-800 bg-[#141416] p-1">
          <Link href="/" className="rounded-full bg-red-600 px-6 py-2 text-sm font-bold shadow-[0_0_18px_rgba(220,38,38,.3)]">▦ Home</Link>
          <Link href="/explore" className="rounded-full px-6 py-2 text-sm font-semibold text-zinc-400 hover:text-white">⌂ For you</Link>
        </div>
      </div>

      <section className="relative mt-1 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-[#303a24] via-[#171b16] to-[#080808] p-6 sm:p-10">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(ellipse at 75% 20%, #a3a36b 0, transparent 45%),linear-gradient(135deg,transparent 40%,#6c5424 100%)'}}/>
        <div className="relative max-w-xl">
          <p className="text-[10px] font-black tracking-[.28em] text-red-300">THE BEDROCK ADD-ON HUB</p>
          <h1 className="mt-3 text-4xl font-black uppercase leading-[.95] tracking-tight sm:text-6xl">Build your<br/><span className="text-red-500">next world.</span></h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-300">Discover add-ons, textures, maps, skins and worlds made for Minecraft Bedrock.</p>
          <Link href="/explore" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black shadow-[0_8px_28px_rgba(220,38,38,.25)] hover:bg-red-500">EXPLORE CONTENT <ChevronRight size={17}/></Link>
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full border-[30px] border-white/5 sm:h-80 sm:w-80"/>
        <div className="absolute bottom-4 right-5 hidden text-right sm:block"><p className="text-5xl font-black italic text-white/10">ZEXO</p><p className="text-[9px] font-bold tracking-[.3em] text-white/40">PLAY DIFFERENT</p></div>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{chips.map(({label,href,icon:Icon,color})=><Link key={label} href={href} className={'inline-flex shrink-0 items-center gap-2 rounded-full border bg-[#101010] px-4 py-2 text-[10px] font-black tracking-wide ' + color}><Icon size={13}/>{label}</Link>)}</div>

      {groups.map(group=><section key={group.title} className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-[13px] font-black tracking-[.16em]">{group.title}</h2><Link href={'/explore?category='+encodeURIComponent(group.category)} className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-zinc-400 hover:text-red-400">MORE <ChevronRight size={13}/></Link></div>
        {group.items.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{group.items.map((item,i)=><PackCard key={item.id} item={item} tone={i % 3 === 0 ? group.tone : i % 3 === 1 ? 'from-blue-950 via-zinc-900 to-black' : 'from-purple-950 via-zinc-900 to-black'}/>)}</div> : <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] px-4 py-8 text-center text-sm text-zinc-500">New releases are coming soon.</div>}
      </section>)}
    </div>

    <footer className="mt-12 border-t border-zinc-900 px-4 py-8 text-center">
      <p className="text-lg font-black italic tracking-wider">FOLLOW <span className="text-red-500">ZEXO</span></p><p className="mt-2 text-xs text-zinc-500">Join our community for daily updates and exclusive content.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">{[['Discord','/support'],['Telegram','/support'],['YouTube','/support'],['X','/support']].map(([label,href])=><Link key={label} href={href} className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold hover:border-red-500/60">{label}</Link>)}</div>
      <p className="mt-6 text-[10px] text-zinc-600">© ZEXO · Independent community marketplace. Not affiliated with Mojang or Microsoft.</p>
    </footer>

    <nav className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-black/90 p-2 shadow-[0_10px_50px_rgba(0,0,0,.8)] backdrop-blur-2xl">
      <Link href="/" aria-label="Home" className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_22px_rgba(220,38,38,.35)]"><Home size={25}/></Link>
      <Link href="/explore" aria-label="Search" className="flex h-14 w-14 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-800"><Search size={26}/></Link>
      <Link href="/favorites" aria-label="Favorites" className="flex h-14 w-14 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-800"><Heart size={26}/></Link>
      <Link href="/settings" aria-label="Settings" className="flex h-14 w-14 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-800"><Settings size={26}/></Link>
    </nav>
  </main>
}

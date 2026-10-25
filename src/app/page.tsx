import Link from 'next/link'
import { ArrowRight, Blocks, Compass, Download, Gamepad2, Search, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

const categories = [
  { name: 'Add-ons', icon: Blocks, description: 'Gameplay, mobs and mechanics' },
  { name: 'Shaders', icon: Sparkles, description: 'Lighting and visual upgrades' },
  { name: 'Maps', icon: Compass, description: 'Worlds, adventures and builds' },
  { name: 'Texture Packs', icon: Gamepad2, description: 'Fresh looks for your game' },
]

export default async function HomePage() {
  let publishedCount = 0
  let user: { email?: string } | null = null
  try {
    const supabase = await createClient()
    const [{ count }, { data: { user: currentUser } }] = await Promise.all([
      supabase.from('add_ons').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.auth.getUser(),
    ])
    publishedCount = count ?? 0
    user = currentUser ? { email: currentUser.email } : null
  } catch { /* The public landing page remains available before environment setup. */ }

  return <main className="min-h-screen overflow-hidden">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <Link href="/" className="text-2xl font-black tracking-[.22em]">ZEXO<span className="text-red-500">.</span></Link>
      <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex"><Link href="#explore" className="hover:text-white">Explore</Link><Link href="/creators" className="hover:text-white">Creators</Link><Link href="/about" className="hover:text-white">About</Link></nav>
      <div className="flex items-center gap-3">{user ? <><Link href="/creator" className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">Creator Portal</Link><form action={signOut}><button type="submit" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-400">Log out</button></form></> : <><Link href="/login" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-400">Log in</Link><Link href="/signup" className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">Join ZEXO</Link></>}</div>
    </header>

    <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="relative max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300"><span className="h-2 w-2 rounded-full bg-red-500"/> THE BEDROCK CREATOR MARKETPLACE</div>
        <h1 className="text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Your next world<br/>starts <span className="text-red-500">here.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">Find add-ons, shaders, maps and resource packs made for Minecraft Bedrock. Discover creators. Build something different.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="#explore" className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 font-semibold text-white shadow-glow hover:bg-red-400">Explore marketplace <ArrowRight size={17}/></Link><Link href="/creators" className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 font-semibold hover:border-zinc-400"><UploadCloud size={17}/> Become a creator</Link></div>
        <div className="mt-12 flex flex-wrap gap-8 border-t border-zinc-900 pt-6 text-sm"><div><div className="text-2xl font-bold">{publishedCount}</div><div className="mt-1 text-zinc-500">Published packs</div></div><div><div className="text-2xl font-bold">Bedrock</div><div className="mt-1 text-zinc-500">Built for players</div></div><div><div className="text-2xl font-bold">Creator-first</div><div className="mt-1 text-zinc-500">Community powered</div></div></div>
      </div>
    </section>

    <section id="explore" className="border-y border-zinc-900 bg-[#0d0d0d] py-16"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.2em] text-red-500">FIND YOUR NEXT FAVORITE</p><h2 className="mt-2 text-3xl font-bold">Explore categories</h2></div><Link href="/explore" className="hidden items-center gap-2 text-sm text-zinc-400 hover:text-white sm:flex">View all <ArrowRight size={16}/></Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map(({name,icon:Icon,description})=><Link key={name} href={`/explore?category=${encodeURIComponent(name)}`} className="group rounded-2xl border border-zinc-800 bg-[#111] p-6 transition hover:-translate-y-1 hover:border-red-500/50"><div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Icon size={22}/></div><h3 className="text-lg font-semibold">{name}</h3><p className="mt-2 text-sm text-zinc-500">{description}</p><div className="mt-6 flex items-center gap-2 text-sm text-zinc-400 group-hover:text-white">Explore <ArrowRight size={15}/></div></Link>)}</div>
    </div></section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8"><div><p className="text-xs font-bold tracking-[.2em] text-red-500">MADE FOR THE COMMUNITY</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Great creations deserve<br/>a great home.</h2><p className="mt-5 max-w-lg leading-7 text-zinc-400">ZEXO gives players one place to discover quality content and gives creators a clear path to submit, manage and grow their work.</p><Link href="/creators" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300">Creator portal <ArrowRight size={16}/></Link></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><Search className="text-red-400"/><h3 className="mt-5 font-semibold">Discover</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Search and filter Bedrock content by type and version.</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><Download className="text-red-400"/><h3 className="mt-5 font-semibold">Download</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Get compatible files and keep your favorites close.</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><UploadCloud className="text-red-400"/><h3 className="mt-5 font-semibold">Create</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Submit packs and track their review status.</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><ShieldCheck className="text-red-400"/><h3 className="mt-5 font-semibold">Moderate</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Review queues and safety checks keep the catalog trusted.</p></div></div></section>

    <footer className="border-t border-zinc-900 px-5 py-8 text-sm text-zinc-500"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row"><span className="font-black tracking-[.2em] text-white">ZEXO<span className="text-red-500">.</span></span><span>Independent community marketplace. Not affiliated with Mojang or Microsoft.</span><div className="flex gap-5"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link></div></div></footer>
  </main>
}

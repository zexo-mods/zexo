import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Creators | ZEXO',
  description: 'Discover verified Minecraft Bedrock creators and publish your creations on ZEXO.',
}

export default async function CreatorsPage() {
  const supabase = await createClient()
  const [{ data: creators }, { count: creatorCount }] = await Promise.all([
    supabase.from('creator_profiles')
      .select('id,display_name,biography,website_url,verification_status')
      .eq('verification_status', 'verified')
      .order('display_name')
      .limit(24),
    supabase.from('creator_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified'),
  ])

  return <main className="min-h-screen bg-[#080808] px-5 py-8 text-white">
    <div className="mx-auto max-w-7xl">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <Link href="/" className="text-xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link>
        <div className="flex gap-3"><Link href="/explore" className="rounded-full border border-zinc-700 px-4 py-2 text-sm">Explore</Link><Link href="/creator" className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold">Creator portal</Link></div>
      </header>
      <section className="py-16 md:py-24">
        <p className="text-xs font-bold tracking-[.2em] text-red-400">THE PEOPLE BEHIND THE PACKS</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Made by creators.<br/><span className="text-red-500">Played by everyone.</span></h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">ZEXO is a home for Minecraft Bedrock add-on makers, map builders, shader artists and resource-pack creators. Share your work with players who are looking for their next world.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-full bg-red-500 px-6 py-3 font-semibold">Join as a creator</Link><Link href="/creator" className="rounded-full border border-zinc-700 px-6 py-3 font-semibold">Open upload center</Link></div>
        <div className="mt-12 flex gap-10 border-t border-zinc-900 pt-6"><div><p className="text-3xl font-bold">{creatorCount ?? 0}</p><p className="mt-1 text-xs text-zinc-500">Verified creators</p></div><div><p className="text-3xl font-bold">Open</p><p className="mt-1 text-xs text-zinc-500">Community submissions</p></div></div>
      </section>
      <section className="border-t border-zinc-900 py-12">
        <div className="mb-7"><p className="text-xs font-bold tracking-[.2em] text-red-400">CREATOR DIRECTORY</p><h2 className="mt-2 text-2xl font-bold">Meet the creators</h2></div>
        {!creators?.length ? <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center"><h3 className="text-lg font-semibold">The directory is just getting started</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Verified creator profiles will appear here. You can submit your first pack today and build your creator presence on ZEXO.</p><Link href="/creator" className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold">Submit your first pack</Link></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{creators.map(creator=><article key={creator.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-lg font-black">{creator.display_name.slice(0,1).toUpperCase()}</div><h3 className="mt-4 flex items-center gap-2 font-semibold">{creator.display_name}{creator.verification_status === 'verified' && <span title="Verified ZEXO creator" aria-label="Verified ZEXO creator" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-white">✓</span>}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{creator.biography || 'Minecraft Bedrock creator'}</p>{creator.website_url && <a href={creator.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-red-400">Creator website ↗</a>}</article>)}</div>}
      </section>
      <footer className="border-t border-zinc-900 py-8 text-sm text-zinc-600"><Link href="/terms">Terms</Link><span className="mx-3">·</span><Link href="/privacy">Privacy</Link><span className="mx-3">·</span><Link href="/support">Support</Link></footer>
    </div>
  </main>
}

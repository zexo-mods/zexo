import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import { submitAddOn } from './actions'

export default async function CreatorPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const [{ data: categories }, { data: submissions }] = await Promise.all([
    supabase.from('categories').select('id,name').eq('active', true).order('display_order'),
    supabase.from('add_ons').select('id,title,status,created_at,moderation_feedback').eq('creator_id', userId).order('created_at', { ascending: false }),
  ])

  return <main className="min-h-screen bg-[#080808] px-5 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6"><div><Link href="/" className="text-xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link><p className="mt-2 text-sm text-zinc-500">Creator portal</p></div><div className="flex items-center gap-3"><Link href="/admin" className="text-sm text-zinc-400 hover:text-white">Admin</Link><form action={signOut}><button className="rounded-full border border-zinc-700 px-4 py-2 text-sm">Sign out</button></form></div></header>
      <div className="grid gap-8 py-8 lg:grid-cols-[1.1fr_.9fr]">
        <section><p className="text-xs font-bold tracking-[.2em] text-red-400">UPLOAD CENTER</p><h1 className="mt-2 text-3xl font-bold">Submit a creation</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Upload your Bedrock pack for moderation. Files are private until an administrator reviews and publishes the submission.</p>
          {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{params.error}</p>}
          {params.submitted && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300">Submission sent for review. It will not appear publicly until approved and published.</p>}
          <form action={submitAddOn} className="mt-7 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label className="block text-sm text-zinc-300">Pack title<input name="title" required minLength={3} maxLength={100} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
            <label className="block text-sm text-zinc-300">Short description<input name="short_description" maxLength={240} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
            <label className="block text-sm text-zinc-300">Full description<textarea name="description" required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-zinc-300">Category<select name="category_id" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"><option value="">Choose category</option>{(categories ?? []).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="block text-sm text-zinc-300">Pack version<input name="version" defaultValue="1.0.0" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label></div>
            <label className="block text-sm text-zinc-300">Minecraft Bedrock version<input name="minecraft_version" placeholder="e.g. 1.21.90" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label>
            <label className="block text-sm text-zinc-300">Pack file (max 100 MB)<input name="file" type="file" required accept=".mcpack,.mcaddon,.mcworld,.mctemplate,.zip" className="mt-2 block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-3 file:py-2 file:font-semibold file:text-white"/></label>
            <p className="text-xs leading-5 text-zinc-500">Only upload content you own or are authorized to distribute. Submitted files remain private while awaiting review.</p>
            <button className="w-full rounded-xl bg-red-500 px-5 py-3 font-semibold hover:bg-red-400">Submit for moderation</button>
          </form>
        </section>
        <section><h2 className="text-xl font-bold">Your submissions</h2><p className="mt-2 text-sm text-zinc-500">Track review status and moderator feedback.</p><div className="mt-5 space-y-3">{(submissions ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">No submissions yet.</div> : (submissions ?? []).map(item=><article key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{item.status.replace('_',' ')}</span></div>{item.moderation_feedback && <p className="mt-3 text-sm text-amber-300">{item.moderation_feedback}</p>}<p className="mt-3 text-xs text-zinc-600">{new Date(item.created_at).toLocaleDateString()}</p></article>)}</div></section>
      </div>
    </div>
  </main>
}

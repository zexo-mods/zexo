import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import { CreatorUploadForm } from './upload-form'

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
          <CreatorUploadForm categories={categories ?? []} />
        </section>
        <section><h2 className="text-xl font-bold">Your submissions</h2><p className="mt-2 text-sm text-zinc-500">Track review status and moderator feedback.</p><div className="mt-5 space-y-3">{(submissions ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">No submissions yet.</div> : (submissions ?? []).map(item=><article key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{item.status.replace('_',' ')}</span></div>{item.moderation_feedback && <p className="mt-3 text-sm text-amber-300">{item.moderation_feedback}</p>}<p className="mt-3 text-xs text-zinc-600">{new Date(item.created_at).toLocaleDateString()}</p></article>)}</div></section>
      </div>
    </div>
  </main>
}

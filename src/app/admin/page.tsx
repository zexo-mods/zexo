import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/auth/actions'
import { moderateAddOn, moderateReport } from './actions'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  if (!adminRole) return <main className="min-h-screen bg-[#080808] px-5 py-20 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8"><h1 className="text-2xl font-bold">Admin access required</h1><p className="mt-3 text-sm leading-6 text-zinc-400">This account does not have the admin role. Add your authenticated user ID to public.user_roles from the Supabase SQL editor to bootstrap the first administrator.</p><Link href="/creator" className="mt-6 inline-block text-sm text-red-400">Return to creator portal</Link></div></main>

  // Only after the authenticated user's admin role is verified do we use the
  // server-only service client to read private moderation metadata.
  const admin = createAdminClient()
  const [{ data: queue, error }, { data: reports }] = await Promise.all([
    admin.from('add_ons').select('id,title,description,created_at,creator_id,add_on_files(id,file_name,file_type,file_size,scan_status,storage_path)').eq('status', 'pending_review').order('created_at', { ascending: true }),
    admin.from('reports').select('id,add_on_id,reason,details,status,created_at').in('status', ['open', 'reviewing']).order('created_at', { ascending: true }),
  ])

  const reviewQueue = await Promise.all((queue ?? []).map(async item => ({
    ...item,
    add_on_files: await Promise.all((item.add_on_files ?? []).map(async file => {
      const { data } = await admin.storage.from('mod-files').createSignedUrl(file.storage_path, 300)
      return { ...file, reviewUrl: data?.signedUrl ?? null }
    })),
  })))

  return <main className="min-h-screen bg-[#080808] px-5 py-8 text-white"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6"><div><Link href="/" className="text-xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link><p className="mt-2 text-sm text-zinc-500">Desktop moderation console</p></div><div className="flex items-center gap-3"><span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">ADMIN</span><form action={signOut}><button className="rounded-full border border-zinc-700 px-4 py-2 text-sm">Sign out</button></form></div></header>
    <section className="py-8"><p className="text-xs font-bold tracking-[.2em] text-red-400">MODERATION WORKSPACE</p><h1 className="mt-2 text-3xl font-bold">Review submissions</h1><p className="mt-2 text-sm text-zinc-500">Inspect private creator files, record manual safety decisions, publish approved packs and handle community reports.</p>
      {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{params.error}</p>}
      {params.updated && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300">Moderation action saved.</p>}
      {error && <p className="mt-5 text-sm text-red-300">{error.message}</p>}
      <div className="mt-7 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><p className="text-sm text-zinc-500">Waiting for review</p><p className="mt-2 text-3xl font-bold">{reviewQueue.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><p className="text-sm text-zinc-500">Open reports</p><p className="mt-2 text-3xl font-bold">{reports?.length ?? 0}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><p className="text-sm text-zinc-500">File policy</p><p className="mt-2 text-xl font-bold">Private until published</p></div></div>
      <div className="mt-10"><h2 className="text-xl font-bold">Creator submissions</h2><div className="mt-5 space-y-5">{reviewQueue.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">The moderation queue is empty.</div> : reviewQueue.map(item=><article key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-1 text-xs text-zinc-600">Submitted {new Date(item.created_at).toLocaleString()} · Creator {item.creator_id}</p></div><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">Pending review</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{item.description}</p>
        <div className="mt-5 space-y-3">{(item.add_on_files ?? []).map(file=><div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 p-4"><div><p className="text-sm font-medium">{file.file_name}</p><p className="mt-1 text-xs text-zinc-500">{file.file_type.toUpperCase()} · {(file.file_size / 1024 / 1024).toFixed(2)} MB · scan: {file.scan_status}</p>{file.reviewUrl && <a href={file.reviewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-red-400">Open private file for manual review ↗</a>}</div><p className="mt-2 text-xs text-zinc-500">File approval is handled automatically when you choose Publish after reviewing the file.</p></div>)}</div>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-black/60 p-4"><p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Admin decision · choose one action</p><form action={moderateAddOn} className="mt-3 space-y-3"><input type="hidden" name="add_on_id" value={item.id}/><input name="reason" placeholder="Optional feedback / moderation note" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-red-500"/><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><button name="action" value="reject" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20">1 · Reject mod</button><button name="action" value="publish" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20">2 · Publish mod</button><button name="action" value="copyright" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20">3 · Copyright</button></div></form></div>
      </article>)}</div></div>
      <div className="mt-12"><h2 className="text-xl font-bold">Community reports</h2><div className="mt-5 space-y-3">{!reports?.length ? <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">No open reports.</div> : reports.map(report=><article key={report.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{report.reason}</p><p className="mt-1 text-xs text-zinc-600">Add-on ID: {report.add_on_id} · {new Date(report.created_at).toLocaleString()}</p><p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">{report.details || 'No additional details.'}</p></div><span className="h-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">{report.status}</span></div><form action={moderateReport} className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4"><input type="hidden" name="report_id" value={report.id}/><select name="status" defaultValue={report.status === 'open' ? 'reviewing' : report.status} className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"><option value="reviewing">Mark reviewing</option><option value="resolved">Resolve</option><option value="dismissed">Dismiss</option></select><button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">Save report status</button></form></article>)}</div></div>
    </section>
  </div></main>
}
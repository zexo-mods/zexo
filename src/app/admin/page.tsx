import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/auth/actions'
import { moderateAddOn, moderateReport, reviewFile } from './actions'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  if (!adminRole) return <main className="min-h-screen bg-[#080808] px-5 py-20 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8"><h1 className="text-2xl font-bold">Admin access required</h1><p className="mt-3 text-sm leading-6 text-zinc-400">This account does not have the admin role. Add your authenticated user ID to public.user_roles from the Supabase SQL editor to bootstrap the first administrator.</p><Link href="/creator" className="mt-6 inline-block text-sm text-red-400">Return to creator portal</Link></div></main>

  const [{ data: queue, error }, { data: reports }] = await Promise.all([
    supabase.from('add_ons').select('id,title,description,created_at,creator_id,add_on_files(id,file_name,file_type,file_size,scan_status,storage_path)').eq('status', 'pending_review').order('created_at', { ascending: true }),
    supabase.from('reports').select('id,add_on_id,reason,details,status,created_at').in('status', ['open', 'reviewing']).order('created_at', { ascending: true }),
  ])

  const admin = createAdminClient()
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
        <div className="mt-5 space-y-3">{(item.add_on_files ?? []).map(file=><div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 p-4"><div><p className="text-sm font-medium">{file.file_name}</p><p className="mt-1 text-xs text-zinc-500">{file.file_type.toUpperCase()} · {(file.file_size / 1024 / 1024).toFixed(2)} MB · scan: {file.scan_status}</p>{file.reviewUrl && <a href={file.reviewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-red-400">Open private file for manual review ↗</a>}</div><form action={reviewFile} className="flex items-center gap-2"><input type="hidden" name="file_id" value={file.id}/><select name="scan_status" defaultValue={file.scan_status === 'pending' ? 'clean' : file.scan_status} className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs"><option value="clean">Mark clean</option><option value="quarantined">Quarantine</option><option value="rejected">Reject file</option></select><button className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:border-zinc-400">Save scan</button></form></div>)}</div>
        <form action={moderateAddOn} className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5"><input type="hidden" name="add_on_id" value={item.id}/><input name="reason" placeholder="Feedback / moderation note" className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-red-500"/><select name="action" defaultValue="request_changes" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"><option value="request_changes">Request changes</option><option value="publish">Publish</option><option value="reject">Reject</option><option value="suspend">Suspend</option></select><button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400">Apply decision</button></form>
      </article>)}</div></div>
      <div className="mt-12"><h2 className="text-xl font-bold">Community reports</h2><div className="mt-5 space-y-3">{!reports?.length ? <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">No open reports.</div> : reports.map(report=><article key={report.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{report.reason}</p><p className="mt-1 text-xs text-zinc-600">Add-on ID: {report.add_on_id} · {new Date(report.created_at).toLocaleString()}</p><p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">{report.details || 'No additional details.'}</p></div><span className="h-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">{report.status}</span></div><form action={moderateReport} className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4"><input type="hidden" name="report_id" value={report.id}/><select name="status" defaultValue={report.status === 'open' ? 'reviewing' : report.status} className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"><option value="reviewing">Mark reviewing</option><option value="resolved">Resolve</option><option value="dismissed">Dismiss</option></select><button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">Save report status</button></form></article>)}</div></div>
    </section>
  </div></main>
}

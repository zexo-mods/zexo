import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { downloadAddOn, reportAddOn } from './actions'

export default async function AddOnDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ reported?: string }> }) {
  const query = await searchParams
  const { slug } = await params
  const supabase = await createClient()
  const { data: addon, error } = await supabase.from('add_ons')
    .select('id,title,description,short_description,version,minecraft_versions,tags,credits,license,download_count,categories(name),add_on_files(id,file_name,file_type,file_size,scan_status)')
    .eq('slug',slug).eq('status','published').maybeSingle()
  if (error || !addon) notFound()
  const files = (addon.add_on_files ?? []).filter((file:{scan_status:string})=>file.scan_status==='clean')

  return <main className="min-h-screen bg-[#080808] px-5 py-8 text-white"><div className="mx-auto max-w-5xl"><header className="border-b border-zinc-800 pb-6"><Link href="/" className="text-xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link></header><Link href="/explore" className="mt-8 inline-block text-sm text-zinc-500 hover:text-white">← Back to marketplace</Link><section className="grid gap-8 py-10 md:grid-cols-[1fr_320px]"><div><p className="text-xs font-bold tracking-[.2em] text-red-400">MINECRAFT BEDROCK CONTENT</p><h1 className="mt-3 text-4xl font-bold">{addon.title}</h1><p className="mt-4 text-lg text-zinc-400">{addon.short_description}</p><div className="mt-6 flex flex-wrap gap-2">{(addon.tags ?? []).map((tag:string)=><span key={tag} className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">{tag}</span>)}</div><div className="mt-10 border-t border-zinc-800 pt-7"><h2 className="text-xl font-semibold">About this pack</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-400">{addon.description}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-zinc-600">Minecraft versions</p><p className="mt-1 text-sm">{(addon.minecraft_versions ?? []).join(', ') || 'Not specified'}</p></div><div><p className="text-xs text-zinc-600">Credits</p><p className="mt-1 text-sm">{addon.credits || 'Not provided'}</p></div><div><p className="text-xs text-zinc-600">License</p><p className="mt-1 text-sm">{addon.license || 'Not specified'}</p></div><div><p className="text-xs text-zinc-600">Downloads</p><p className="mt-1 text-sm">{addon.download_count}</p></div></div></div></div><aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><p className="text-sm text-zinc-500">Version {addon.version}</p><h2 className="mt-2 text-xl font-semibold">Download pack</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Only files that passed the moderation scan are available.</p><div className="mt-6 space-y-3">{files.length===0 ? <p className="text-sm text-amber-300">No approved file is available yet.</p> : files.map((file:{id:string;file_name:string;file_type:string;file_size:number})=><form key={file.id} action={downloadAddOn}><input type="hidden" name="addon_id" value={addon.id}/><input type="hidden" name="file_id" value={file.id}/><button className="w-full rounded-xl bg-red-500 px-4 py-3 text-left text-sm font-semibold hover:bg-red-400"><span className="block">{file.file_name}</span><span className="mt-1 block text-xs font-normal text-red-100">{file.file_type.toUpperCase()} · {(file.file_size/1024/1024).toFixed(2)} MB</span></button></form>)}</div>
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-semibold">Report this pack</h3>
        <p className="mt-2 text-xs leading-5 text-zinc-500">Report broken, misleading or unauthorized content for moderator review.</p>
        {query.reported && <p className="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/30 p-2 text-xs text-emerald-300">Your report was submitted.</p>}
        <form action={reportAddOn} className="mt-3 space-y-2">
          <input type="hidden" name="addon_id" value={addon.id}/>
          <input type="hidden" name="slug" value={slug}/>
          <select name="reason" required className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"><option value="">Choose a reason</option><option value="Broken download">Broken download</option><option value="Malware or suspicious file">Malware or suspicious file</option><option value="Copyright or ownership concern">Copyright or ownership concern</option><option value="Misleading description">Misleading description</option><option value="Other">Other</option></select>
          <textarea name="details" rows={3} maxLength={2000} placeholder="Optional details" className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"/>
          <button className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-zinc-500">Send report</button>
        </form>
      </div></aside></section></div></main>
}

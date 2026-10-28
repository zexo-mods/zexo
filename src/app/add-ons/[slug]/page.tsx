import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reportAddOn, toggleFavorite } from './actions'
import { Download, Heart, Share2, ShieldCheck, Images, ArrowDownToLine, ChevronRight, MessageCircle } from 'lucide-react'

type Pack = {
  id: string
  title: string
  slug: string
  thumbnail_path: string | null
  download_count: number | null
  categories?: { name?: string } | null
}

export default async function AddOnDetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reported?: string }>
}) {
  const query = await searchParams
  const { slug } = await params
  const supabase = await createClient()
  const { data: addon, error } = await supabase.from('add_ons')
    .select('id,title,description,short_description,version,minecraft_versions,tags,credits,license,download_count,thumbnail_path,category_id,categories(name),add_on_files(id,file_name,file_type,file_size,scan_status)')
    .eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error || !addon) notFound()

  const files = (addon.add_on_files ?? []).filter((file: { scan_status: string }) => file.scan_status === 'clean')
  const totalSize = files.reduce((sum: number, file: { file_size: number }) => sum + (file.file_size || 0), 0)
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  const [{ data: favorite }, { data: gallery }, { data: related }, { data: popular }] = await Promise.all([
    userId ? supabase.from('favorites').select('add_on_id').eq('user_id', userId).eq('add_on_id', addon.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('add_on_images').select('id,image_path,display_order').eq('add_on_id', addon.id).order('display_order'),
    supabase.from('add_ons').select('id,title,slug,thumbnail_path,download_count,categories(name)').eq('status', 'published').eq('category_id', addon.category_id).neq('id', addon.id).order('published_at', { ascending: false }).limit(8),
    supabase.from('add_ons').select('id,title,slug,thumbnail_path,download_count,categories(name)').eq('status', 'published').neq('id', addon.id).order('download_count', { ascending: false }).limit(8),
  ])
  const imageUrl = (path: string | null) => path ? supabase.storage.from('mod-images').getPublicUrl(path).data.publicUrl : null
  const galleryImages = (gallery ?? []).map((image: { id: string; image_path: string }) => ({ id: image.id, url: imageUrl(image.image_path) })).filter((image): image is { id: string; url: string } => Boolean(image.url))
  const cover = galleryImages[0]?.url ?? imageUrl(addon.thumbnail_path)
  const ModRail = ({ title, items }: { title: string; items: Pack[] | null }) => (
    <section className="mt-9">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-black"><span className="h-5 w-1 rounded-full bg-red-500" />{title}</h2>
        <Link href="/explore" className="flex items-center gap-1 text-xs font-bold text-zinc-500">MORE <ChevronRight size={14}/></Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none]">
        {(items ?? []).map((item) => (
          <Link key={item.id} href={'/add-ons/' + item.slug} className="w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#111216]">
            <div className="relative aspect-[1.25] bg-gradient-to-br from-slate-800 to-zinc-950">
              {imageUrl(item.thumbnail_path) && <img src={imageUrl(item.thumbnail_path)!} alt="" loading="lazy" className="h-full w-full object-cover"/>}
              <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-1 text-[8px] font-black text-red-300">ADD-ON</span>
            </div>
            <div className="p-2.5"><p className="truncate text-[11px] font-extrabold">{item.title}</p><p className="mt-1 text-[9px] text-zinc-500">{item.download_count ?? 0} downloads</p></div>
          </Link>
        ))}
        {(!items || items.length === 0) && <p className="text-xs text-zinc-500">More mods are coming soon.</p>}
      </div>
    </section>
  )

  return (
    <main className="min-h-screen bg-[#080808] pb-12 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-black italic tracking-tight">Z<span className="text-red-500">E</span>XO<span className="text-red-500">.</span></Link>
        <Link href="/explore" className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300">Explore mods</Link>
      </header>
      <div className="mx-auto max-w-5xl">
        <div className="relative aspect-[16/7] max-h-[340px] overflow-hidden bg-gradient-to-br from-amber-950 via-zinc-900 to-black sm:rounded-2xl">
          {cover && <img src={cover} alt={addon.title} className="h-full w-full object-cover"/>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10"/>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div><p className="text-[10px] font-black tracking-[.2em] text-red-300">ZEXO • MINECRAFT BEDROCK</p><h1 className="mt-1 text-2xl font-black sm:text-4xl">{addon.title}</h1></div>
            <span className="rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-bold backdrop-blur">{addon.categories?.name ?? 'Add-on'}</span>
          </div>
        </div>
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-4">
            <span className="text-xs font-bold text-zinc-500">Version {addon.version}</span>
            <div className="flex items-center gap-2">
              <form action={toggleFavorite}><input type="hidden" name="addon_id" value={addon.id}/><input type="hidden" name="slug" value={slug}/><button aria-label="Save to favorites" className={'flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 ' + (favorite ? 'bg-red-600 text-white' : 'bg-zinc-900 text-red-400')}><Heart size={19} fill={favorite ? 'currentColor' : 'none'}/></button></form>
              <a href="#share" aria-label="Share" className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900"><Share2 size={18}/></a>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{addon.short_description}</p>
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#111113] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-emerald-400"><ShieldCheck size={15}/> ZEXO PROTECT • SCANNED FILES</div>
            {files.length === 0 ? <p className="rounded-xl bg-zinc-900 p-4 text-sm text-amber-300">No approved download is available yet.</p> : files.map((file: { id: string; file_name: string; file_type: string; file_size: number }) => (
              <a key={file.id} href={'/download/' + file.id} className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-4 text-left text-black transition hover:bg-zinc-200">
                <span className="flex items-center gap-3"><Download size={19}/><span><span className="block text-sm font-black">Download</span><span className="block text-[10px] text-zinc-500">{file.file_name}</span></span></span>
                <span className="text-xs font-bold">{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
              </a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 text-xs"><div className="text-zinc-500">File size <strong className="float-right text-white">{(totalSize / 1024 / 1024).toFixed(2)} MB</strong></div><div className="text-zinc-500"><Images size={13} className="mr-1 inline"/> Gallery <strong className="float-right text-white">{galleryImages.length} images</strong></div></div>
          </div>
          {galleryImages.length > 0 && <section className="mt-6"><h2 className="mb-3 text-base font-black">Gallery</h2><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">{galleryImages.map((image, i) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="w-40 shrink-0 overflow-hidden rounded-xl border border-zinc-800"><img src={image.url} alt={addon.title + ' screenshot ' + (i + 1)} className="aspect-video w-full object-cover"/></a>)}</div></section>}
          <section className="mt-8 border-t border-zinc-800 pt-6"><h2 className="text-xl font-black">Description</h2><div className="mt-4 rounded-xl border border-zinc-800 bg-[#111113] px-4 py-3 text-center text-xs text-zinc-400">◎ Translate</div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{addon.description}</p></section>
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-[#101012] p-4 text-xs"><div><p className="text-zinc-500">Minecraft versions</p><p className="mt-1 font-semibold">{(addon.minecraft_versions ?? []).join(', ') || 'Not specified'}</p></div><div><p className="text-zinc-500">Downloads</p><p className="mt-1 font-semibold">{addon.download_count ?? 0}</p></div><div><p className="text-zinc-500">Credits</p><p className="mt-1 font-semibold">{addon.credits || 'Not provided'}</p></div><div><p className="text-zinc-500">License</p><p className="mt-1 font-semibold">{addon.license || 'Not specified'}</p></div></div>
          <ModRail title="Suggested Mods" items={(related ?? []) as Pack[]}/>
          <ModRail title="Most Downloaded Mods" items={(popular ?? []) as Pack[]}/>
          <section className="mt-10 rounded-2xl border border-zinc-900 bg-gradient-to-br from-[#190909] to-black px-5 py-8 text-center">
            <h2 className="text-xl font-black italic">FOLLOW ZEXO</h2><p className="mt-2 text-xs text-zinc-500">Join our community for daily updates and exclusive content!</p>
            <div className="mx-auto mt-5 grid max-w-sm gap-2">{[['TikTok','/support'],['YouTube','/support'],['Discord','/support'],['Telegram','/support'],['X','/support']].map(([name, href])=><Link key={name} href={href} className="rounded-full border border-zinc-800 py-3 text-xs font-bold transition hover:border-red-500">{name}</Link>)}</div>
          </section>
          <section className="mt-8 rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-bold">Report this pack</h2><p className="mt-2 text-xs leading-5 text-zinc-500">Report broken, misleading or unauthorized content for moderator review.</p>
            {query.reported && <p className="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/30 p-2 text-xs text-emerald-300">Your report was submitted.</p>}
            <form action={reportAddOn} className="mt-3 space-y-2"><input type="hidden" name="addon_id" value={addon.id}/><input type="hidden" name="slug" value={slug}/><select name="reason" required className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"><option value="">Choose a reason</option><option value="Broken download">Broken download</option><option value="Malware or suspicious file">Malware or suspicious file</option><option value="Copyright or ownership concern">Copyright or ownership concern</option><option value="Misleading description">Misleading description</option><option value="Other">Other</option></select><textarea name="details" rows={3} maxLength={2000} placeholder="Optional details" className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"/><button className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-zinc-500">Send report</button></form>
          </section>
        </div>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reportAddOn, toggleFavorite } from './actions'
import { Download, Heart, Share2, ShieldCheck, Images, ChevronRight, CalendarDays, UserRound, FileArchive } from 'lucide-react'
import ModHeroGallery from '@/components/mod-hero-gallery'

type Pack = {
  id: string
  title: string
  slug: string
  thumbnail_path: string | null
  download_count: number | null
  categories?: { name?: string } | null
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export default async function AddOnDetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reported?: string; favorite_error?: string }>
}) {
  const query = await searchParams
  const { slug } = await params
  const supabase = await createClient()
  const { data: addon, error } = await supabase.from('add_ons')
    .select('id,creator_id,title,slug,description,short_description,version,minecraft_versions,tags,credits,license,download_count,thumbnail_path,category_id,published_at,created_at,categories(name),add_on_files(id,file_name,file_type,file_size,scan_status)')
    .eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error || !addon) notFound()

  const files = (addon.add_on_files ?? []).filter((file: { scan_status: string }) => file.scan_status === 'clean')
  const totalSize = files.reduce((sum: number, file: { file_size: number }) => sum + (file.file_size || 0), 0)
  const firstFile = files[0]
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  const [{ data: favorite }, { data: gallery }, { data: related }, { data: popular }, { data: creator }] = await Promise.all([
    userId ? supabase.from('favorites').select('add_on_id').eq('user_id', userId).eq('add_on_id', addon.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('add_on_images').select('id,image_path,display_order').eq('add_on_id', addon.id).order('display_order'),
    supabase.from('add_ons').select('id,title,slug,thumbnail_path,download_count,categories(name)').eq('status', 'published').eq('category_id', addon.category_id).neq('id', addon.id).order('published_at', { ascending: false }).limit(8),
    supabase.from('add_ons').select('id,title,slug,thumbnail_path,download_count,categories(name)').eq('status', 'published').neq('id', addon.id).order('download_count', { ascending: false }).limit(8),
    supabase.from('creator_profiles').select('display_name,verification_status').eq('user_id', addon.creator_id).maybeSingle(),
  ])
  const imageUrl = (path: string | null) => path ? supabase.storage.from('mod-images').getPublicUrl(path).data.publicUrl : null
  const galleryImages = (gallery ?? []).map((image: { id: string; image_path: string }) => ({ id: image.id, url: imageUrl(image.image_path) })).filter((image): image is { id: string; url: string } => Boolean(image.url))
  const categoryRelation = addon.categories as unknown as { name?: string } | { name?: string }[] | null
  const categoryName = (Array.isArray(categoryRelation) ? categoryRelation[0]?.name : categoryRelation?.name) ?? 'Add-on'
  const publishedDate = addon.published_at ?? addon.created_at
  const ModRail = ({ title, items, accent }: { title: string; items: Pack[] | null; accent: string }) => (
    <section className="mt-9">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-black"><span className={'h-5 w-1 rounded-full ' + accent} />{title}</h2>
        <Link href="/explore" className="flex items-center gap-1 text-xs font-bold text-zinc-500 transition hover:text-white">MORE <ChevronRight size={14}/></Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none]">
        {(items ?? []).map((item) => (
          <Link key={item.id} href={'/add-ons/' + item.slug} className="w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#111216] transition hover:-translate-y-1 hover:border-red-500/60">
            <div className="relative aspect-[1.25] bg-gradient-to-br from-slate-800 to-zinc-950">
              {imageUrl(item.thumbnail_path) && <img src={imageUrl(item.thumbnail_path)!} alt="" loading="lazy" className="h-full w-full object-cover"/>}
              <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-1 text-[8px] font-black text-red-300">{categoryName.toUpperCase()}</span>
            </div>
            <div className="p-2.5"><p className="truncate text-[11px] font-extrabold">{item.title}</p><p className="mt-1 text-[9px] text-zinc-500">{item.download_count ?? 0} downloads</p></div>
          </Link>
        ))}
        {(!items || items.length === 0) && <p className="text-xs text-zinc-500">More mods are coming soon.</p>}
      </div>
    </section>
  )

  return (
    <main className="min-h-screen bg-[#080808] pb-28 text-white sm:pb-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-2xl font-black italic tracking-tight">Z<span className="text-red-500">E</span>XO<span className="text-red-500">.</span></Link>
        <Link href="/explore" className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-red-500/60">Explore mods</Link>
      </header>
      <div className="mx-auto max-w-5xl">
        <ModHeroGallery images={galleryImages} fallback={imageUrl(addon.thumbnail_path)} title={addon.title} />
        <div className="px-4 sm:px-6">
          <div className="pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-red-300">{categoryName}</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400"><ShieldCheck size={12}/> ZEXO Protect</span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-black uppercase leading-tight sm:text-3xl">{addon.title}</h1>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{addon.short_description}</p>
              </div>
              <span className="shrink-0 rounded-lg border border-zinc-800 bg-[#171719] px-3 py-2 text-[10px] font-bold text-zinc-300">v{addon.version}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-zinc-800 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5"><UserRound size={13}/>{creator?.display_name || 'ZEXO Creator'}</span>
              {publishedDate && <span className="flex items-center gap-1.5"><CalendarDays size={13}/>{new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleFavorite}><input type="hidden" name="addon_id" value={addon.id}/><input type="hidden" name="slug" value={slug}/><button aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'} className={'flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 transition ' + (favorite ? 'bg-red-600 text-white' : 'bg-zinc-900 text-red-400 hover:border-red-500')}><Heart size={19} fill={favorite ? 'currentColor' : 'none'}/></button></form>
              <a href={"https://twitter.com/intent/tweet?url=" + encodeURIComponent("https://zexo.zexomods.workers.dev/add-ons/" + slug) + "&text=" + encodeURIComponent(addon.title)} target="_blank" rel="noopener noreferrer" aria-label="Share this add-on" className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300"><Share2 size={18}/></a>
            </div>
          </div>
          {query.favorite_error && <p className="mt-3 rounded-lg border border-red-900 bg-red-950/30 p-3 text-xs text-red-300">Could not update your favorites. Please try again.</p>}
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#111113] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-red-300"><ShieldCheck size={16}/> File information: ZEXO Protect</div>
              <span className="rounded-md border border-emerald-900 bg-emerald-950/40 px-2 py-1 text-[8px] font-black uppercase text-emerald-300">Approved files</span>
            </div>
            {files.length === 0 ? <p className="mt-4 rounded-xl bg-zinc-900 p-4 text-sm text-amber-300">No approved download is available yet.</p> : <div className="mt-4 space-y-2">{files.map((file: { id: string; file_name: string; file_type: string; file_size: number; file_version?: string }) => (
              <a key={file.id} href={'/download/' + file.id} className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-4 text-left text-black transition hover:bg-zinc-200">
                <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><Download size={19}/></span><span className="min-w-0"><span className="block text-sm font-black">Download</span><span className="block truncate text-[10px] text-zinc-500">{file.file_name} · {file.file_type.toUpperCase()}</span></span></span>
                <span className="shrink-0 text-xs font-bold">{formatBytes(file.file_size)}</span>
              </a>
            ))}</div>}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 text-xs sm:grid-cols-3">
              <div className="text-zinc-500"><FileArchive size={13} className="mr-1 inline"/> Total size <strong className="float-right text-white">{formatBytes(totalSize)}</strong></div>
              <div className="text-zinc-500"><Images size={13} className="mr-1 inline"/> Gallery <strong className="float-right text-white">{galleryImages.length} images</strong></div>
              <div className="col-span-2 text-zinc-500 sm:col-span-1">Downloads <strong className="float-right text-white">{addon.download_count ?? 0}</strong></div>
            </div>
          </div>
          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h2 className="text-xl font-black">Description</h2>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{addon.description}</p>
          </section>
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-[#101012] p-4 text-xs sm:grid-cols-4">
            <div><p className="text-zinc-500">Version</p><p className="mt-1 font-semibold">v{addon.version}</p></div>
            <div><p className="text-zinc-500">Minecraft versions</p><p className="mt-1 font-semibold">{(addon.minecraft_versions ?? []).join(', ') || 'Not specified'}</p></div>
            <div><p className="text-zinc-500">Credits</p><p className="mt-1 font-semibold">{addon.credits || 'Not provided'}</p></div>
            <div><p className="text-zinc-500">License</p><p className="mt-1 font-semibold">{addon.license || 'Not specified'}</p></div>
          </div>
          <ModRail title="Suggested Mods" items={(related ?? []) as Pack[]} accent="bg-amber-400"/>
          <ModRail title="Most Downloaded Mods" items={(popular ?? []) as Pack[]} accent="bg-red-500"/>
          <section className="mt-10 rounded-2xl border border-zinc-900 bg-gradient-to-br from-[#190909] to-black px-5 py-8 text-center">
            <h2 className="text-xl font-black italic">FOLLOW ZEXO</h2><p className="mt-2 text-xs text-zinc-500">Join our community for daily updates and exclusive content!</p>
            <div className="mx-auto mt-5 grid max-w-sm gap-2">{[['TikTok','https://www.tiktok.com/'],['YouTube','https://www.youtube.com/'],['Discord','https://discord.com/'],['Telegram','https://telegram.org/'],['X','https://x.com/']].map(([name, href])=><a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-800 py-3 text-xs font-bold transition hover:border-red-500">{name}</a>)}</div>
          </section>
          <section className="mt-8 rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-bold">Report this pack</h2><p className="mt-2 text-xs leading-5 text-zinc-500">Report broken, misleading or unauthorized content for moderator review.</p>
            {query.reported && <p className="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/30 p-2 text-xs text-emerald-300">Your report was submitted.</p>}
            <form action={reportAddOn} className="mt-3 space-y-2"><input type="hidden" name="addon_id" value={addon.id}/><input type="hidden" name="slug" value={slug}/><select name="reason" required className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"><option value="">Choose a reason</option><option value="Broken download">Broken download</option><option value="Malware or suspicious file">Malware or suspicious file</option><option value="Copyright or ownership concern">Copyright or ownership concern</option><option value="Misleading description">Misleading description</option><option value="Other">Other</option></select><textarea name="details" rows={3} maxLength={2000} placeholder="Optional details" className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"/><button className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-zinc-500">Send report</button></form>
          </section>
        </div>
      </div>
      {firstFile && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-[#09090b]/95 p-3 backdrop-blur-xl sm:hidden"><a href={'/download/' + firstFile.id} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/40"><Download size={18}/> DOWNLOAD · {formatBytes(firstFile.file_size)}</a></div>}
    </main>
  )
}

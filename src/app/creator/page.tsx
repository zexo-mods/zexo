import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import { CreatorUploadForm } from './upload-form'
import { updateCreatorAddOn, deleteCreatorAddOn } from './actions'
import { AddScreenshots } from './add-screenshots'
import { mediaPath } from '@/lib/r2'

type Submission = {
  id: string; slug: string; title: string; short_description: string | null; description: string;
  version: string | null; status: string; created_at: string; moderation_feedback: string | null;
  thumbnail_path: string | null; add_on_images: { id: string; image_path: string; display_order: number }[];
}

export default async function CreatorPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string; updated?: string; deleted?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?next=/creator')

  const [{ data: categories }, { data: submissions }, { data: roles }] = await Promise.all([
    supabase.from('categories').select('id,name').eq('active', true).order('display_order'),
    supabase.from('add_ons').select('id,slug,title,short_description,description,version,status,created_at,moderation_feedback,thumbnail_path,add_on_images(id,image_path,display_order)').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ])
  const isAdmin = (roles ?? []).some(role => role.role === 'admin')
  const items = (submissions ?? []) as Submission[]
  const imageUrl = mediaPath
  const counts = { total: items.length, published: items.filter(x => x.status === 'published').length, review: items.filter(x => x.status === 'pending_review').length }

  return <main className="min-h-screen bg-[#080809] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div><Link href="/" className="text-2xl font-black italic tracking-[.18em]">ZEXO<span className="text-red-500">.</span></Link><p className="mt-1 text-xs font-bold uppercase tracking-[.2em] text-zinc-600">Creator studio</p></div>
        <div className="flex flex-wrap items-center gap-2"><Link href="/" className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300">Marketplace</Link>{isAdmin && <Link href="/admin" className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-300">Admin console</Link>}<form action={signOut}><button className="rounded-full border border-zinc-700 px-4 py-2 text-sm">Sign out</button></form></div>
      </header>

      <section className="py-8">
        <p className="text-xs font-black tracking-[.22em] text-red-400">CREATOR WORKSPACE</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black sm:text-4xl">Your creations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Upload Bedrock mods, add screenshots, manage your releases and track moderation status.</p></div><a href="#upload" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">＋ Upload a mod</a></div>
        {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{params.error}</p>}
        {params.submitted && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Submission sent for review.</p>}
        {params.updated && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Your changes were saved.</p>}
        {params.deleted && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Creation and its uploaded files were deleted.</p>}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5"><p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total creations</p><p className="mt-2 text-3xl font-black">{counts.total}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5"><p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Published</p><p className="mt-2 text-3xl font-black text-emerald-300">{counts.published}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-5"><p className="text-xs font-bold uppercase tracking-widest text-zinc-500">In review</p><p className="mt-2 text-3xl font-black text-amber-300">{counts.review}</p></div>
        </div>
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section id="manage">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">Manage your mods</h2><p className="mt-1 text-xs text-zinc-500">Edit details, review screenshots or remove your own uploads.</p></div><span className="text-xs text-zinc-500">{items.length} items</span></div>
          <div className="space-y-4">
            {items.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-9 text-center"><p className="font-semibold">No creations yet</p><p className="mt-2 text-sm text-zinc-500">Your uploads will appear here.</p></div> : items.map(item => {
              const images = [...(item.add_on_images ?? [])].sort((a,b)=>a.display_order-b.display_order)
              const cover = imageUrl(item.thumbnail_path || images[0]?.image_path || null)
              return <article key={item.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113]">
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-red-950 to-zinc-900 sm:h-28 sm:w-40">{cover ? <img src={cover} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-3xl font-black text-white/20">Z</div>}</div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{item.title}</h3><span className={'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide '+(item.status==='published'?'bg-emerald-500/10 text-emerald-300':item.status==='pending_review'?'bg-amber-500/10 text-amber-300':'bg-zinc-800 text-zinc-300')}>{item.status.replaceAll('_',' ')}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{item.short_description || item.description}</p><p className="mt-2 text-[11px] text-zinc-600">{images.length} screenshot(s) · Version {item.version || '1.0.0'} · {new Date(item.created_at).toLocaleDateString()}</p>{item.moderation_feedback && <p className="mt-2 text-xs text-amber-300">Review note: {item.moderation_feedback}</p>}</div>
                </div>
                {images.length > 0 && <div className="flex gap-2 overflow-x-auto border-t border-zinc-800 px-4 py-3">{images.map((image,index)=>{const src=imageUrl(image.image_path);return src?<a key={image.id} href={src} target="_blank" rel="noreferrer" className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-800"><img src={src} alt={'Screenshot '+(index+1)} className="h-full w-full object-cover"/></a>:null})}</div>}<div className="px-4 pb-3"><AddScreenshots addOnId={item.id} userId={userId}/></div>
                <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 px-4 py-3">
                  <details className="min-w-0 flex-1"><summary className="cursor-pointer text-xs font-bold text-red-300 hover:text-red-200">Edit details</summary><form action={updateCreatorAddOn} className="mt-4 space-y-3"><input type="hidden" name="add_on_id" value={item.id}/><label className="block text-xs text-zinc-400">Title<input name="title" required minLength={3} maxLength={100} defaultValue={item.title} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"/></label><label className="block text-xs text-zinc-400">Short description<input name="short_description" maxLength={240} defaultValue={item.short_description ?? ''} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"/></label><label className="block text-xs text-zinc-400">Description<textarea name="description" required minLength={10} maxLength={5000} rows={4} defaultValue={item.description} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"/></label><label className="block text-xs text-zinc-400">Replace mod logo / cover (PNG, JPG or WEBP · max 5 MB)<input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-300 file:mr-2 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-white"/></label><label className="block text-xs text-zinc-400">Version<input name="version" defaultValue={item.version ?? '1.0.0'} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"/></label><button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold">Save changes</button>{item.status==='published' && <p className="text-[11px] text-amber-300">Editing a published mod sends it back for review.</p>}</form></details>
                  {item.status==='published' && <Link href={'/add-ons/'+item.slug} className="text-xs text-zinc-400 hover:text-white">Open</Link>}
                  <form action={deleteCreatorAddOn}><input type="hidden" name="add_on_id" value={item.id}/><button className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10">Delete mod</button></form>
                </div>
              </article>
            })}
          </div>
        </section>

        <section id="upload" className="rounded-2xl border border-zinc-800 bg-[#101012] p-4 sm:p-5">
          <p className="text-[10px] font-black tracking-[.2em] text-red-400">UPLOAD CENTER</p><h2 className="mt-2 text-xl font-black">Submit a creation</h2><p className="mt-2 text-xs leading-5 text-zinc-500">Pack file plus up to 10 screenshots. New uploads remain private until approved.</p>
          <CreatorUploadForm categories={categories ?? []}/>
        </section>
      </div>
    </div>
  </main>
}

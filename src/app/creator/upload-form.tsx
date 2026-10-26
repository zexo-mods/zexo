'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDraftAddOn } from './actions'

type Category = { id: number; name: string }

export function CreatorUploadForm({ categories }: { categories: Category[] }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  function chooseScreenshots(files: FileList | null) {
    previewUrls.forEach(URL.revokeObjectURL)
    setPreviewUrls(Array.from(files ?? []).slice(0, 5).map(file => URL.createObjectURL(file)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setMessage('')
    const form = event.currentTarget
    const data = new FormData(form)
    const pack = data.get('file')
    const screenshots = data.getAll('screenshots').filter((value): value is File => value instanceof File && value.size > 0)
    const uploadedPaths: string[] = []
    try {
      if (!(pack instanceof File) || !pack.size) throw new Error('Choose a Minecraft pack file.')
      if (pack.size > 100 * 1024 * 1024) throw new Error('Pack file must be 100 MB or smaller.')
      const ext = pack.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['mcpack','mcaddon','mcworld','mctemplate','zip'].includes(ext)) throw new Error('Allowed pack files: mcpack, mcaddon, mcworld, mctemplate and zip.')
      if (screenshots.length > 5) throw new Error('Upload up to 5 screenshots.')
      for (const shot of screenshots) {
        if (!['image/png','image/jpeg','image/webp'].includes(shot.type)) throw new Error('Screenshots must be PNG, JPG or WEBP images.')
        if (shot.size > 8 * 1024 * 1024) throw new Error('Each screenshot must be 8 MB or smaller.')
      }
      const supabase = createClient()
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || !auth.user) throw new Error('Session expired. Please sign in again.')
      let id = draftId
      if (!id) {
        const draft = new FormData()
        for (const key of ['title','short_description','description','category_id','version','minecraft_version']) draft.set(key, String(data.get(key) ?? ''))
        const created = await createDraftAddOn(draft)
        if (created.error || !created.id) throw new Error(created.error ?? 'Could not create draft.')
        id = created.id; setDraftId(id)
      }
      const packPath = auth.user.id + '/' + id + '/' + crypto.randomUUID() + '.' + ext
      const { error: packError } = await supabase.storage.from('mod-files').upload(packPath, pack, { contentType: pack.type || 'application/octet-stream', upsert: false })
      if (packError) throw new Error('Pack upload failed: ' + packError.message)
      uploadedPaths.push(packPath)
      const { error: fileRowError } = await supabase.from('add_on_files').insert({ add_on_id: id, storage_path: packPath, file_name: pack.name, file_type: ext, file_size: pack.size, file_version: String(data.get('version') || '1.0.0') })
      if (fileRowError) throw new Error('Could not save pack details: ' + fileRowError.message)

      const imageRows: { add_on_id: string; image_path: string; display_order: number }[] = []
      for (let index = 0; index < screenshots.length; index++) {
        const shot = screenshots[index]
        const imageExt = shot.type === 'image/jpeg' ? 'jpg' : shot.type === 'image/png' ? 'png' : 'webp'
        const path = auth.user.id + '/' + id + '/screenshots/' + crypto.randomUUID() + '.' + imageExt
        const { error } = await supabase.storage.from('mod-images').upload(path, shot, { contentType: shot.type, upsert: false })
        if (error) throw new Error('Screenshot upload failed: ' + error.message)
        uploadedPaths.push(path)
        imageRows.push({ add_on_id: id, image_path: path, display_order: index })
      }
      if (imageRows.length) {
        const { error } = await supabase.from('add_on_images').insert(imageRows)
        if (error) throw new Error('Could not save screenshots: ' + error.message)
        const { error: thumbError } = await supabase.from('add_ons').update({ thumbnail_path: imageRows[0].image_path }).eq('id', id)
        if (thumbError) throw new Error('Screenshots saved, but cover image could not be set: ' + thumbError.message)
      }
      const { error: submitError } = await supabase.from('add_ons').update({ status: 'pending_review' }).eq('id', id)
      if (submitError) throw new Error('Files uploaded but submission failed: ' + submitError.message)
      setMessage('Submitted successfully! Your pack and screenshots are waiting for admin review.')
      setDraftId(null); form.reset(); setPreviewUrls([])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.')
      // Keep uploaded objects attached to the draft for safe retry; never delete creator content automatically.
    } finally { setBusy(false) }
  }

  return <form onSubmit={handleSubmit} className="mt-7 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
    {message && <p role="status" className="rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm text-zinc-300">Pack title<input name="title" required minLength={3} maxLength={100} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
      <label className="block text-sm text-zinc-300">Category<select name="category_id" required className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    </div>
    <label className="block text-sm text-zinc-300">Short description<input name="short_description" maxLength={240} placeholder="A quick summary for the marketplace" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label>
    <label className="block text-sm text-zinc-300">Full description<textarea name="description" required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-zinc-300">Pack version<input name="version" defaultValue="1.0.0" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label><label className="block text-sm text-zinc-300">Minecraft Bedrock version<input name="minecraft_version" placeholder="e.g. 1.21.90" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label></div>
    <label className="block text-sm text-zinc-300">Minecraft pack file <span className="text-zinc-600">(max 100 MB)</span><input name="file" type="file" required accept=".mcpack,.mcaddon,.mcworld,.mctemplate,.zip" className="mt-2 block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:font-bold file:text-white"/></label>
    <div className="rounded-xl border border-dashed border-zinc-700 bg-black/50 p-4">
      <label className="block text-sm font-semibold text-zinc-200">Screenshots / gallery images <span className="font-normal text-zinc-500">up to 5 · PNG, JPG, WEBP · 8 MB each</span><input name="screenshots" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>chooseScreenshots(e.target.files)} className="mt-3 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-white"/></label>
      {previewUrls.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{previewUrls.map((url,i)=><div key={url} className="relative overflow-hidden rounded-lg border border-zinc-800"><img src={url} alt={'Screenshot preview '+(i+1)} className="aspect-square w-full object-cover"/>{i===0 && <span className="absolute bottom-1 left-1 rounded bg-red-600 px-2 py-1 text-[9px] font-bold">COVER</span>}</div>)}</div>}
    </div>
    <p className="text-xs leading-5 text-zinc-500">Only upload files and screenshots you own or are authorized to distribute. Your submission stays private until an administrator reviews it.</p>
    <button disabled={busy} className="w-full rounded-xl bg-red-600 px-5 py-3.5 font-bold hover:bg-red-500 disabled:opacity-60">{busy ? 'Uploading pack and screenshots…' : 'Submit pack for moderation'}</button>
  </form>
}
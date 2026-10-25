'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDraftAddOn } from './actions'

type Category = { id: number; name: string }

export function CreatorUploadForm({ categories }: { categories: Category[] }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    const form = event.currentTarget
    const data = new FormData(form)
    const file = data.get('file')
    try {
      if (!(file instanceof File) || file.size < 1) throw new Error('Choose a pack file to upload.')
      if (file.size > 100 * 1024 * 1024) throw new Error('File must be 100 MB or smaller.')
      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      const allowed = ['mcpack','mcaddon','mcworld','mctemplate','zip']
      if (!allowed.includes(extension)) throw new Error('Allowed files: mcpack, mcaddon, mcworld, mctemplate and zip.')

      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error('Your session expired. Sign in again.')

      let currentDraftId = draftId
      if (!currentDraftId) {
        // Keep binary files out of the Server Action request. The pack is uploaded
        // directly from this browser to Supabase Storage below.
        const draftData = new FormData()
        for (const field of ['title', 'short_description', 'description', 'category_id', 'version', 'minecraft_version']) {
          draftData.set(field, String(data.get(field) ?? ''))
        }
        const created = await createDraftAddOn(draftData)
        if (created.error || !created.id) throw new Error(created.error ?? 'Could not create your draft.')
        currentDraftId = created.id
        setDraftId(currentDraftId)
      }

      const path = authData.user.id + '/' + currentDraftId + '/' + crypto.randomUUID() + '.' + extension
      const { error: uploadError } = await supabase.storage.from('mod-files').upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })
      if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

      const { error: fileError } = await supabase.from('add_on_files').insert({
        add_on_id: currentDraftId,
        storage_path: path,
        file_name: file.name,
        file_type: extension,
        file_size: file.size,
        file_version: String(data.get('version') ?? '1.0.0'),
      })
      if (fileError) {
        await supabase.storage.from('mod-files').remove([path])
        throw new Error('Could not save file details: ' + fileError.message)
      }

      const { error: submitError } = await supabase.from('add_ons').update({ status: 'pending_review' }).eq('id', currentDraftId)
      if (submitError) throw new Error('File uploaded, but submission could not be sent: ' + submitError.message)

      setMessage('Your pack has been submitted. It stays private until an administrator reviews and publishes it.')
      setDraftId(null)
      form.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={handleSubmit} className="mt-7 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
    {message && <p role="status" className="rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300">{message}</p>}
    <label className="block text-sm text-zinc-300">Pack title<input name="title" required minLength={3} maxLength={100} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
    <label className="block text-sm text-zinc-300">Short description<input name="short_description" maxLength={240} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
    <label className="block text-sm text-zinc-300">Full description<textarea name="description" required minLength={10} maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-zinc-300">Category<select name="category_id" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="block text-sm text-zinc-300">Pack version<input name="version" defaultValue="1.0.0" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label></div>
    <label className="block text-sm text-zinc-300">Minecraft Bedrock version<input name="minecraft_version" placeholder="e.g. 1.21.90" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3"/></label>
    <label className="block text-sm text-zinc-300">Pack file (max 100 MB)<input name="file" type="file" required accept=".mcpack,.mcaddon,.mcworld,.mctemplate,.zip" className="mt-2 block w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-3 file:py-2 file:font-semibold file:text-white"/></label>
    <p className="text-xs leading-5 text-zinc-500">Only upload content you own or are authorized to distribute. Submitted files remain private while awaiting review.</p>
    <button disabled={busy} className="w-full rounded-xl bg-red-500 px-5 py-3 font-semibold hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Uploading…' : 'Submit for moderation'}</button>
  </form>
}

'use client'

import { useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveCreatorScreenshotPaths } from './actions'

export function AddScreenshots({ addOnId, userId }: { addOnId: string; userId: string }) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    setFiles(selected.slice(0, 10))
    setMessage(selected.length > 10 ? 'Only the first 10 images were selected.' : '')
  }

  async function upload() {
    if (!files.length || busy) return
    setBusy(true)
    setMessage('')
    const uploaded: string[] = []
    try {
      for (const file of files) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use PNG, JPG or WEBP screenshots.')
        if (file.size > 8 * 1024 * 1024) throw new Error('Each screenshot must be 8 MB or smaller.')
      }
      const supabase = createClient()
      for (const file of files) {
        const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
        const path = userId + '/' + addOnId + '/screenshots/' + crypto.randomUUID() + '.' + ext
        const { error } = await supabase.storage.from('mod-images').upload(path, file, { contentType: file.type, upsert: false })
        if (error) throw new Error(error.message)
        uploaded.push(path)
      }
      const saved = await saveCreatorScreenshotPaths(addOnId, JSON.stringify(uploaded))
      if (saved.error) throw new Error(saved.error)
      setFiles([])
      setMessage('Screenshots added to your mod.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Screenshot upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-black/40 p-3">
    <label className="block text-xs font-semibold text-zinc-300">Add more screenshots <span className="font-normal text-zinc-500">(up to 10 per upload · 8 MB each)</span>
      <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={choose} className="mt-2 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-white"/>
    </label>
    {files.length > 0 && <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] text-zinc-500">{files.length} image(s) selected</span><button type="button" onClick={upload} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold disabled:opacity-50">{busy ? 'Uploading…' : 'Upload screenshots'}</button></div>}
    {message && <p role="status" className="mt-2 text-xs text-zinc-300">{message}</p>}
  </div>
}

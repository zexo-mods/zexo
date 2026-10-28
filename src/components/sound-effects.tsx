"use client"

import { useCallback, useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const STORAGE_KEY = 'zexo-sound-effects'

export default function SoundEffects() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved !== null) setEnabled(saved === 'on')
    } catch {}
  }, [])

  const play = useCallback((kind: 'tap' | 'success' | 'error' = 'tap') => {
    if (!enabled) return
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const context = new AudioContextClass()
      const now = context.currentTime
      const notes = kind === 'success' ? [660, 880] : kind === 'error' ? [220, 165] : [520]
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.075)
        gain.gain.setValueAtTime(0.0001, now + index * 0.075)
        gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.075 + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.075 + 0.11)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(now + index * 0.075)
        oscillator.stop(now + index * 0.075 + 0.12)
      })
      window.setTimeout(() => void context.close(), 500)
    } catch {}
  }, [enabled])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest('button, a, [role="button"], input[type="submit"]')
      if (!control || control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true') return
      if (control.closest('[data-no-sound]')) return
      play('tap')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [play])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    try { window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off') } catch {}
    if (next) play('success')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? 'Turn sound effects off' : 'Turn sound effects on'}
      title={enabled ? 'Sound effects on' : 'Sound effects off'}
      data-no-sound
      className="fixed bottom-24 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-zinc-950/90 text-zinc-100 shadow-lg backdrop-blur-xl transition hover:bg-zinc-800"
    >
      {enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
    </button>
  )
}

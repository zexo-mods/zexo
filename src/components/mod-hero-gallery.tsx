'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'

type GalleryImage = { id: string; url: string }

export default function ModHeroGallery({
  images,
  fallback,
  title,
}: {
  images: GalleryImage[]
  fallback: string | null
  title: string
}) {
  const slides = images.length ? images : fallback ? [{ id: 'cover', url: fallback }] : []
  const [active, setActive] = useState(0)
  const current = slides[active]

  if (!current) {
    return (
      <div className="flex aspect-[16/8] max-h-[390px] items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-950 to-black text-zinc-600">
        <Images size={42} />
      </div>
    )
  }

  const move = (direction: number) =>
    setActive((index) => (index + direction + slides.length) % slides.length)

  return (
    <section className="overflow-hidden bg-[#0d0d0f] sm:rounded-2xl">
      <div className="relative aspect-[16/8] max-h-[390px] overflow-hidden bg-black sm:aspect-[16/7]">
        <img
          key={current.id}
          src={current.url}
          alt={title + ' preview ' + (active + 1)}
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => move(-1)} aria-label="Previous screenshot" className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next screenshot" className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">
          {active + 1} / {slides.length}
        </span>
      </div>
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={'Show screenshot ' + (index + 1)}
              aria-pressed={active === index}
              className={'h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ' + (active === index ? 'border-red-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100')}
            >
              <img src={slide.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

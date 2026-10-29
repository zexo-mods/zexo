import Link from 'next/link'
import { Home, Search, Heart, Settings } from 'lucide-react'

const items = [
  { href: '/', label: 'Home', icon: Home, key: 'home' },
  { href: '/explore', label: 'Explore', icon: Search, key: 'explore' },
  { href: '/favorites', label: 'Favorites', icon: Heart, key: 'favorites' },
  { href: '/settings', label: 'Settings', icon: Settings, key: 'settings' },
]

export default function MobileBottomNav({ active }: { active: 'home' | 'explore' | 'favorites' | 'settings' }) {
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-black/90 p-2 shadow-[0_10px_50px_rgba(0,0,0,.8)] backdrop-blur-2xl">
      {items.map(({ href, label, icon: Icon, key }) => {
        const selected = active === key
        return <Link key={key} href={href} aria-label={label} aria-current={selected ? 'page' : undefined} className={'flex h-12 w-12 items-center justify-center rounded-full transition ' + (selected ? 'bg-red-600 text-white shadow-[0_0_22px_rgba(220,38,38,.35)]' : 'text-zinc-300 hover:bg-zinc-800')}>
          <Icon size={23} />
        </Link>
      })}
    </nav>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'
import SoundEffects from '@/components/sound-effects'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export const metadata: Metadata = {
  title: 'ZEXO — Minecraft Bedrock Add-ons',
  description: 'Discover Minecraft Bedrock add-ons, maps, shaders, resource packs and worlds from creators.',
  applicationName: 'ZEXO',
  icons: {
    icon: '/images/zexo-logo.webp',
    shortcut: '/images/zexo-logo.webp',
    apple: '/images/zexo-logo.webp',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SoundEffects /></body></html>
}

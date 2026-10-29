import type { Metadata } from 'next'
import './globals.css'
import SoundEffects from '@/components/sound-effects'

export const metadata: Metadata = {
  title: 'ZEXO — Minecraft Bedrock Add-ons',
  description: 'Discover Minecraft Bedrock add-ons, maps, shaders, resource packs and worlds from creators.',
  applicationName: 'ZEXO',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SoundEffects /></body></html>
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, UserRound, Heart, Upload, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { updateAccountSettings } from './actions'
import { signOut } from '@/app/auth/actions'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login?next=/settings')
  const [{ data: userData }, { data: profile }, { count: favoriteCount }, { data: roles }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('username,display_name,avatar_url').eq('id', userId).maybeSingle(),
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ])
  const isAdmin = (roles ?? []).some(role=>role.role === 'admin')
  return <main className="min-h-screen bg-[#080809] px-4 py-7 text-white sm:px-6"><div className="mx-auto max-w-4xl">
    <header className="flex items-center justify-between border-b border-zinc-800 pb-5"><Link href="/" className="text-xl font-black italic tracking-widest">ZEXO<span className="text-red-500">.</span></Link><Link href="/creator" className="text-sm text-zinc-400 hover:text-white">Creator portal</Link></header>
    <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft size={16}/> Back home</Link>
    <div className="mt-7"><p className="text-xs font-black tracking-[.2em] text-red-400">ACCOUNT</p><h1 className="mt-2 text-3xl font-black">Settings</h1><p className="mt-2 text-sm text-zinc-500">Manage your ZEXO profile and account shortcuts.</p></div>
    {params.saved && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Your profile settings have been saved.</p>}
    {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{params.error}</p>}
    <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_280px]">
      <form action={updateAccountSettings} className="rounded-2xl border border-zinc-800 bg-[#101012] p-5 sm:p-7">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-300"><UserRound/></span><div><h2 className="font-bold">Public profile</h2><p className="text-xs text-zinc-500">Shown alongside your creator activity.</p></div></div>
        <label className="mt-6 block text-sm text-zinc-300">Username<input name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" defaultValue={profile?.username ?? (userData?.user?.email?.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0,24)} className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
        <label className="mt-4 block text-sm text-zinc-300">Display name<input name="display_name" maxLength={60} defaultValue={profile?.display_name ?? ''} placeholder="Your display name" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
        <label className="mt-4 block text-sm text-zinc-300">Avatar image URL<input name="avatar_url" type="url" defaultValue={profile?.avatar_url ?? ''} placeholder="https://..." className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-500"/></label>
        <label className="mt-4 block text-sm text-zinc-300">Email address<input value={userData?.user?.email ?? ''} readOnly className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-500"/></label>
        <button className="mt-6 w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">Save profile</button>
      </form>
      <aside className="space-y-3">
        <Link href="/favorites" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#101012] p-4 hover:border-red-500/50"><span className="flex items-center gap-3"><Heart className="text-red-400"/><span><b className="block text-sm">Favorites</b><small className="text-zinc-500">{favoriteCount ?? 0} saved packs</small></span></span><span className="text-zinc-500">→</span></Link>
        <Link href="/creator" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#101012] p-4 hover:border-red-500/50"><span className="flex items-center gap-3"><Upload className="text-red-400"/><span><b className="block text-sm">Creator portal</b><small className="text-zinc-500">Upload packs and screenshots</small></span></span><span className="text-zinc-500">→</span></Link>
        {isAdmin && <Link href="/admin" className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/5 p-4"><span className="flex items-center gap-3"><ShieldCheck className="text-red-300"/><span><b className="block text-sm">Admin console</b><small className="text-zinc-500">Moderation dashboard</small></span></span><span className="text-zinc-500">→</span></Link>}
        <form action={signOut} className="rounded-2xl border border-zinc-800 bg-[#101012] p-4"><p className="text-sm font-bold">Sign out</p><p className="mt-1 text-xs text-zinc-500">Sign out of this device.</p><button className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold hover:border-red-500/50">Sign out</button></form>
      </aside>
    </div>
  </div></main>
}

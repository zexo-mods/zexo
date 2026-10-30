import Link from 'next/link'
import MobileBottomNav from '@/components/mobile-bottom-nav'
import { redirect } from 'next/navigation'
import { UserRound, Heart, Upload, ShieldCheck, Globe, Headphones, LogOut, Pencil, ChevronRight, LockKeyhole } from 'lucide-react'
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
  const isAdmin = (roles ?? []).some(role => role.role === 'admin')
  const email = userData?.user?.email ?? ''
  const displayName = profile?.display_name || profile?.username || email.split('@')[0] || 'ZEXO Member'
  const initials = displayName.slice(0, 1).toUpperCase()

  return <main className="min-h-screen bg-[#080B12] px-4 pb-32 pt-6 text-white sm:px-6 sm:pt-8">
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" aria-label="ZEXO home" className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"><img src="/images/zexo-logo.webp" alt="ZEXO" className="h-full w-full object-contain" /></Link>
        <span className="text-sm font-semibold text-zinc-400">Settings</span>
      </header>

      <section className="mb-8 flex items-center gap-4 rounded-[28px] border border-[#263244] bg-[#111827]/75 p-5 shadow-[0_12px_40px_rgba(0,0,0,.25)]">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400/40 bg-slate-800 text-3xl font-black text-sky-300">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile avatar" className="h-full w-full object-cover"/> : initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="mt-1 truncate text-sm text-zinc-500">{email}</p>
          <p className="mt-1 truncate text-xs text-zinc-600">@{profile?.username || 'set-username'}</p>
        </div>
        <a href="#edit-profile" aria-label="Edit profile" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sky-300 transition hover:bg-slate-700"><Pencil size={23}/></a>
      </section>

      {params.saved && <p className="mb-5 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">Your profile settings have been saved.</p>}
      {params.error && <p className="mb-5 rounded-2xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{params.error}</p>}

      <div className="space-y-4">
        <section className="flex min-h-[104px] items-center gap-4 rounded-[24px] border border-[#263244] bg-[#111827]/65 px-5 py-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300"><Globe size={27}/></span>
          <span className="flex-1 text-lg font-bold">Language</span>
          <span className="flex items-center gap-3 text-base text-zinc-400">English <ChevronRight size={21}/></span>
        </section>

        <Link href="/support" className="flex min-h-[104px] items-center gap-4 rounded-[24px] border border-[#263244] bg-[#111827]/65 px-5 py-5 transition hover:border-sky-400/50">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300"><LockKeyhole size={27}/></span>
          <span className="flex-1 text-lg font-bold">Account & Password Help</span><ChevronRight className="text-zinc-500" size={22}/>
        </Link>

        <Link href="/support" className="flex min-h-[104px] items-center gap-4 rounded-[24px] border border-[#263244] bg-[#111827]/65 px-5 py-5 transition hover:border-sky-400/50">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300"><Headphones size={27}/></span>
          <span className="flex-1 text-lg font-bold">Support</span><ChevronRight className="text-zinc-500" size={22}/>
        </Link>

        <form action={signOut} className="rounded-[24px] border border-rose-500/30 bg-rose-500/[.06]">
          <button className="flex min-h-[104px] w-full items-center gap-4 px-5 py-5 text-left text-rose-400">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-500/15"><LogOut size={27}/></span>
            <span className="text-lg font-bold">Log Out</span>
          </button>
        </form>
      </div>

      <section id="edit-profile" className="mt-8 scroll-mt-6 rounded-[24px] border border-[#263244] bg-[#111827]/65 p-5">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sky-300"><UserRound/></span><div><h2 className="font-bold">Edit profile</h2><p className="text-xs text-zinc-500">Update the details shown on your account.</p></div></div>
        <form action={updateAccountSettings}>
          <label className="block text-sm text-zinc-300">Username<input name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" defaultValue={profile?.username ?? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0,24)} className="mt-2 w-full rounded-xl border border-[#263244] bg-[#080B12] px-4 py-3 outline-none focus:border-sky-400"/></label>
          <label className="mt-4 block text-sm text-zinc-300">Display name<input name="display_name" maxLength={60} defaultValue={profile?.display_name ?? ''} placeholder="Your display name" className="mt-2 w-full rounded-xl border border-[#263244] bg-[#080B12] px-4 py-3 outline-none focus:border-sky-400"/></label>
          <label className="mt-4 block text-sm text-zinc-300">Avatar image URL<input name="avatar_url" type="url" defaultValue={profile?.avatar_url ?? ''} placeholder="https://..." className="mt-2 w-full rounded-xl border border-[#263244] bg-[#080B12] px-4 py-3 outline-none focus:border-sky-400"/></label>
          <label className="mt-4 block text-sm text-zinc-300">Email address<input value={email} readOnly className="mt-2 w-full rounded-xl border border-[#263244] bg-slate-900 px-4 py-3 text-zinc-500"/></label>
          <button className="mt-5 w-full rounded-xl bg-sky-400 px-5 py-3 font-bold text-[#080B12] transition hover:bg-cyan-300">Save profile</button>
        </form>
      </section>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Link href="/favorites" className="flex items-center gap-3 rounded-2xl border border-[#263244] bg-[#111827]/65 p-4"><Heart className="text-sky-300"/><span><b className="block text-sm">Favorites</b><small className="text-xs text-zinc-500">{favoriteCount ?? 0} saved packs</small></span></Link>
        <Link href="/creator" className="flex items-center gap-3 rounded-2xl border border-[#263244] bg-[#111827]/65 p-4"><Upload className="text-sky-300"/><span><b className="block text-sm">Creator portal</b><small className="text-xs text-zinc-500">Manage uploads</small></span></Link>
        {isAdmin && <Link href="/admin" className="col-span-2 flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-400/[.06] p-4"><ShieldCheck className="text-sky-300"/><span><b className="block text-sm">Admin console</b><small className="text-xs text-zinc-500">Moderation dashboard</small></span></Link>}
      </div>
      <p className="mt-8 text-center text-xs text-zinc-600">ZEXO · Minecraft Bedrock Add-ons</p>
    </div>
    <MobileBottomNav active="settings"/>
  </main>
}

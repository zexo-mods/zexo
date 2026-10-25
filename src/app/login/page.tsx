import Link from 'next/link'
import { signIn } from '@/app/auth/actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; checkEmail?: string }> }) {
  const params = await searchParams
  return <main className="flex min-h-screen items-center justify-center px-5 py-12">
    <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
      <Link href="/" className="text-2xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link>
      <h1 className="mt-8 text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">Sign in to your ZEXO account.</p>
      {params.checkEmail && <p className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300">Check your email to confirm your account, then sign in.</p>}
      {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{params.error}</p>}
      <form action={signIn} className="mt-7 space-y-4">
        <label className="block text-sm text-zinc-300">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-red-500"/></label>
        <label className="block text-sm text-zinc-300">Password<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-red-500"/></label>
        <button className="w-full rounded-xl bg-red-500 px-4 py-3 font-semibold hover:bg-red-400">Sign in</button>
      </form>
      <p className="mt-6 text-sm text-zinc-500">New to ZEXO? <Link href="/signup" className="text-red-400 hover:text-red-300">Create an account</Link></p>
    </div>
  </main>
}

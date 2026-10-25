import Link from 'next/link'
import { signUp } from '@/app/auth/actions'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return <main className="flex min-h-screen items-center justify-center px-5 py-12">
    <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
      <Link href="/" className="text-2xl font-black tracking-[.2em]">ZEXO<span className="text-red-500">.</span></Link>
      <h1 className="mt-8 text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-400">Join the Bedrock creator community.</p>
      {params.error && <p className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{params.error}</p>}
      <form action={signUp} className="mt-7 space-y-4">
        <label className="block text-sm text-zinc-300">Username<input name="username" minLength={3} maxLength={24} required autoComplete="username" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-red-500"/></label>
        <label className="block text-sm text-zinc-300">Email<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-red-500"/></label>
        <label className="block text-sm text-zinc-300">Password<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-red-500"/><span className="mt-1 block text-xs text-zinc-500">At least 8 characters.</span></label>
        <button className="w-full rounded-xl bg-red-500 px-4 py-3 font-semibold hover:bg-red-400">Create account</button>
      </form>
      <p className="mt-6 text-sm text-zinc-500">Already registered? <Link href="/login" className="text-red-400 hover:text-red-300">Sign in</Link></p>
    </div>
  </main>
}

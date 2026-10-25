'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const AUTH_CALLBACK_URL = 'https://zexo.zexomods.workers.dev/auth/callback'

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) redirect('/login?error=Enter%20your%20email%20and%20password')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'email_not_confirmed') {
      redirect('/login?error=' + encodeURIComponent('Please confirm your email using the link we sent you. Check your inbox and spam folder.'))
    }
    redirect('/login?error=' + encodeURIComponent(error.message))
  }
  redirect('/')
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim()
  if (!email || !password || username.length < 3) redirect('/signup?error=Please%20complete%20all%20fields')
  if (password.length < 8) redirect('/signup?error=Password%20must%20be%20at%20least%208%20characters')

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_name: username, display_name: username },
      emailRedirectTo: AUTH_CALLBACK_URL,
    },
  })
  if (error) redirect('/signup?error=' + encodeURIComponent(error.message))
  redirect('/login?checkEmail=1')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

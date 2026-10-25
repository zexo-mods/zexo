# ZEXO — Minecraft Bedrock Marketplace

A clean rebuild of ZEXO using Next.js App Router, TypeScript, Tailwind CSS and Supabase.

## Stack
- Next.js 15 + React 19 + TypeScript
- Supabase Auth, Postgres, Row Level Security and Storage
- Mobile-first web UI, prepared for Capacitor Android packaging

## Setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project.
4. Keep `SUPABASE_SECRET_KEY` server-only. Never commit real secrets or prefix them with `NEXT_PUBLIC_`.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

## Database
Apply `supabase/migrations/20261025060000_zexo_clean_marketplace.sql` to the connected Supabase project. The migration enables RLS on every exposed application table and creates private file storage policies.

## Deployment
Deploy the Next.js app on a full-stack host such as Vercel. GitHub Pages is not suitable for this dynamic application. Configure the same environment variables in the host dashboard.

## Android
Capacitor packaging is a later stage after the web application and auth flows are tested. No APK is included yet.

## Status
This is the initial foundation. Creator submission UI, admin dashboard, moderation workflows, notifications, analytics, automated tests and Capacitor packaging are staged for subsequent implementation.

# ZEXO setup guide

## 1. Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: the project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.
- `SUPABASE_SECRET_KEY`: the secret key, server-side only. It is required for signing downloads and admin moderation.

Never put the secret key in a `NEXT_PUBLIC_*` variable, client component, source control, or public build artifact.

## 2. Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration, set the Site URL to your deployed app URL and add these Redirect URLs:

- `http://localhost:3000/**`
- Your production domain with `/**`

Email confirmation settings are controlled by the Supabase Auth project settings. Test the confirmation link and password sign-in before launch.

## 3. Bootstrap the first administrator

1. Register your own account at `/signup`.
2. Open Supabase Dashboard → Authentication → Users and copy your user UUID.
3. Run this statement in Supabase SQL Editor, replacing the placeholder:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

Only the project owner should bootstrap the first administrator.

## 4. Creator uploads and moderation

Creator uploads go directly from the browser to the private `mod-files` Storage bucket. The first path segment must match the signed-in user's UUID. The database accepts pack file types `mcpack`, `mcaddon`, `mcworld`, `mctemplate`, and `zip`, with a 100 MB application limit.

An administrator must manually inspect each submission and file before marking its scan status clean. Automated malware scanning is not integrated yet. Publishing is blocked until at least one file is marked clean.

## 5. Build and deploy

Use a full-stack Next.js host (for example, Vercel); GitHub Pages cannot run the server actions and signed-download logic. Configure the three environment variables above in the host dashboard. The GitHub Actions workflow runs dependency installation, TypeScript checks and a production build on pushes to `main`.

## 6. Launch checklist

- Confirm Supabase Auth email and redirect configuration.
- Add the first admin role.
- Set the secret key only in server-side hosting environment variables.
- Test creator upload with a small non-sensitive pack.
- Test file review, publish, and signed download.
- Review legal pages with a qualified professional.
- Integrate automated malware scanning, reporting workflows, monitoring and backups before opening submissions broadly.
- Capacitor Android packaging and APK/AAB generation are a later stage; no Android binary is currently included.

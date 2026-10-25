# ZEXO setup and launch guide

## 1. Stack

- GitHub: source code and CI.
- Cloudflare Workers: full-stack Next.js hosting and automatic deployments from GitHub.
- Supabase: Auth, Postgres, row-level security, and private file storage.

## 2. Environment variables

Use the Supabase project URL and publishable key in both the Cloudflare Workers Build variables and the Worker's runtime variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Set `SUPABASE_SECRET_KEY` as a secret in the Worker runtime settings and as a build secret only if the build needs it. It is server-only. Never put it in a `NEXT_PUBLIC_*` variable, client component, source control, or public build artifact.

## 3. Connect GitHub to Cloudflare Workers

1. Open Cloudflare Dashboard → Workers & Pages.
2. Choose Create application → Connect to Git.
3. Authorize the Cloudflare GitHub App if prompted.
4. Select `zexo-mods/zexo`, branch `main`.
5. Use repository root as the root directory.
6. Set Build command to `npm run cf-build`.
7. Set Deploy command to `npm run deploy`.
8. Set Preview command to `npm run preview`.
9. Add the two public Supabase variables to Build variables and secrets so Next.js can compile.
10. Add all three variables in the Worker Settings → Variables and Secrets for runtime. Mark `SUPABASE_SECRET_KEY` as a secret.
11. Deploy and wait for the first successful build. Cloudflare will provide a `workers.dev` URL.

The regular `build` script runs `next build`; the `cf-build` script runs the OpenNext adapter. Use `npm run cf-build` in Cloudflare Workers Builds.

Pushing commits to `main` will trigger deployments after the Git connection is active.

## 4. Supabase Auth URL configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Set Site URL to the deployed Cloudflare Worker URL.
- Add `http://localhost:3000/**` for local testing.
- Add the deployed Worker URL with `/**` as an allowed redirect URL.

Test email confirmation and password sign-in.

## 5. Bootstrap the first administrator

1. Register your own account at `/signup`.
2. Open Supabase Dashboard → Authentication → Users and copy your user UUID.
3. Run this in Supabase SQL Editor, replacing the placeholder:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

Only the project owner should bootstrap the first administrator.

## 6. Creator uploads and moderation

Creator uploads go directly from the browser to the private `mod-files` Storage bucket. The first path segment must match the signed-in user's UUID. Accepted file types are `mcpack`, `mcaddon`, `mcworld`, `mctemplate`, and `zip`, with a 100 MB application limit.

An administrator must manually inspect each submission and file before marking its scan status clean. Automated malware scanning is not integrated. Publishing is blocked until at least one file is marked clean.

## 7. Launch verification

Test each flow on the deployed site:

- Homepage, category links, search, add-on details.
- Signup, email confirmation, login, and logout.
- Creator upload, submission status, and private file access.
- Admin access, file review, publish, reject, and audit records.
- Signed download of a published file.
- Mobile layout and accessibility.

Review the legal pages with a qualified professional. Configure backups, monitoring, abuse reporting and malware scanning before opening submissions broadly.

Capacitor Android packaging and APK/AAB generation are a separate follow-up task; this repository currently contains the website, not an Android binary.

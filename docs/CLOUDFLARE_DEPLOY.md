# Deploy ZEXO to Cloudflare Workers

ZEXO uses Next.js 15 and the OpenNext Cloudflare adapter. GitHub remains the source repository; Cloudflare Workers Builds handles automatic deployments.

## Cloudflare Workers Build settings

- Repository: `zexo-mods/zexo`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Preview command: `npm run preview`

## Required environment variables

Set these in the Worker build settings for production and preview as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Use the existing Supabase project URL and publishable key. Obtain the Supabase secret key from the Supabase dashboard and add it as a secret. Never put the secret key in source code, a NEXT_PUBLIC_ variable, or a committed file.

## First connection

1. Open Cloudflare Dashboard > Workers & Pages.
2. Choose Create application > GitHub and authorize the Cloudflare GitHub App.
3. Select `zexo-mods/zexo` and branch `main`.
4. Set the build commands and environment variables above.
5. Save and deploy. Cloudflare will provide a `workers.dev` URL.
6. Pushes to `main` will trigger new builds after the Git integration is active.

## Notes

- This app uses Next.js server features, so deploy it as a Worker, not as a static Cloudflare Pages export.
- Supabase remains the database/auth/storage provider.
- Do not expose `SUPABASE_SECRET_KEY` to browser code.
- Verify signup, login, creator uploads, admin moderation, and signed downloads after the first successful deployment.

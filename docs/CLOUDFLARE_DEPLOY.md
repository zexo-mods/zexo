# Deploy ZEXO to Cloudflare Workers

ZEXO uses Next.js 15 and the OpenNext Cloudflare adapter. GitHub remains the source repository; Cloudflare Workers Builds handles automatic deployments.

## Cloudflare Workers Build settings

- Repository: `zexo-mods/zexo`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Preview command: `npm run preview`

The build command generates the OpenNext output once. The deploy and preview commands then publish or run that already-built output.

## Required environment variables

Set these in the Worker build settings for production and preview as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Set all three variables in the Worker runtime settings too:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Use the existing Supabase project URL and publishable key. Obtain the Supabase secret key from the Supabase dashboard and add it as a runtime secret. Never put the secret key in source code, a `NEXT_PUBLIC_` variable, or a committed file.

## First connection

1. Open Cloudflare Dashboard > Workers & Pages.
2. Choose Create application > GitHub and authorize the Cloudflare GitHub App for the `zexo-mods` account.
3. Select `zexo-mods/zexo` and branch `main`.
4. Name the Worker `zexo` to match `wrangler.jsonc`.
5. Set the build commands and environment variables above.
6. Save and deploy. Cloudflare will provide a `workers.dev` URL.
7. Pushes to `main` will trigger new builds after the Git integration is active.

## Notes

- This app uses Next.js server features, so deploy it as a Worker, not as a static Cloudflare Pages export.
- Supabase remains the database/auth/storage provider.
- Do not expose `SUPABASE_SECRET_KEY` to browser code.
- Verify signup, login, creator uploads, admin moderation, reports, and signed downloads after the first successful deployment.

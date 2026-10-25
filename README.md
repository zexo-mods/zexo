# ZEXO — Minecraft Bedrock Marketplace

ZEXO is a mobile-first community marketplace for Minecraft Bedrock add-ons, shaders, maps, texture packs, skins and worlds.

## Technology
- GitHub: source control and CI checks.
- Cloudflare Workers: full-stack Next.js hosting and Git-connected deployments.
- Supabase: authentication, PostgreSQL, row-level security and private file storage.
- Next.js 15 / React 19 / TypeScript / Tailwind CSS.

## Main website features
- Public homepage, creator directory, marketplace browse, search and category filters.
- Add-on detail pages with secure signed downloads and community reports.
- Email/password registration, login and logout through Supabase Auth.
- Creator upload portal for Bedrock pack files (100 MB app limit) and submission tracking.
- Desktop moderation console with private review links, manual file status decisions, publishing, rejection and report handling.
- Moderation events, audit records and creator notifications.

## Local setup
1. Install Node.js 22 or later.
2. Copy .env.example to .env.local.
3. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
4. Configure SUPABASE_SECRET_KEY as a server-only secret. Never expose it to the browser.
5. Run npm install, then npm run dev.

See docs/SETUP.md for the full Supabase and Cloudflare setup guide.

## Deployment
The production target is Cloudflare Workers using the OpenNext Cloudflare adapter. Connect zexo-mods/zexo to a Worker named zexo, configure the Supabase variables and deploy from the main branch. See docs/CLOUDFLARE_DEPLOY.md.

## Safety and launch notes
- Uploaded files are private until an administrator reviews them.
- File safety review is manual; automated malware scanning is not integrated.
- Review legal pages and configure monitoring, backups and abuse workflows before broad public launch.
- Creator payouts and payment processing are not implemented.
- Capacitor Android packaging and APK/AAB generation are a separate follow-up; no Android binary is included.

## CI
GitHub Actions runs lint, TypeScript checks and a Cloudflare-adapted production build on pushes and pull requests to main.

# ZEXO — Minecraft Bedrock Marketplace

ZEXO is a mobile-first community marketplace for Minecraft Bedrock add-ons, shaders, maps, texture packs, skins and worlds.

## Technology
- GitHub: source control and CI checks.
- Cloudflare Workers: full-stack Next.js hosting and Git-connected deployments.
- Cloudflare R2: pack files, thumbnails and screenshots.
- Supabase: authentication, PostgreSQL and marketplace metadata.
- Next.js 15 / React 19 / TypeScript / Tailwind CSS.
- Capacitor 7: Android application shell for the live ZEXO website.

## Website
Production website: https://zexo.zexomods.workers.dev/

## Android APK
The Android app uses Capacitor and loads the live ZEXO website from Cloudflare Workers. Website changes therefore appear in the app without rebuilding the APK. The app uses package ID `com.zexo.mods`.

A GitHub Actions workflow builds a debug APK on pushes to `main` or `feat/android-apk`, and when manually started:
1. Open the repository's **Actions** tab.
2. Select **ZEXO Android APK** and run the workflow, or open a successful run.
3. Download the **ZEXO-Android-APK** artifact.
4. Extract it and install `app-debug.apk` on an Android device. Android may ask you to allow installation from that source.

For local Android development, install Android Studio and Java 21, then run:
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

The generated debug APK is for testing and direct installation. A signed release APK or Android App Bundle (AAB) for Google Play requires a release signing key and Play Console setup.

## Main website features
- Public homepage, creator directory, marketplace browse, search and category filters.
- Add-on detail pages with secure downloads and community reports.
- Email/password registration, login and logout through Supabase Auth.
- Creator upload portal for Bedrock pack files and submission tracking.
- Desktop moderation console with private review links, manual file status decisions, publishing, rejection and report handling.

## Local setup
1. Install Node.js 22 or later.
2. Copy .env.example to .env.local.
3. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
4. Configure SUPABASE_SECRET_KEY as a server-only secret. Never expose it to the browser.
5. Run npm install, then npm run dev.

See docs/SETUP.md for the full Supabase and Cloudflare setup guide.

## Deployment
The production target is Cloudflare Workers using the OpenNext Cloudflare adapter. See docs/CLOUDFLARE_DEPLOY.md.

## Safety and launch notes
- Uploaded files are private until an administrator reviews them.
- File safety review is manual; automated malware scanning is not integrated.
- Review legal pages and configure monitoring, backups and abuse workflows before broad public launch.
- Creator payouts and payment processing are not implemented.

# ZEXO

ZEXO is an Android-first Minecraft Bedrock community marketplace for add-ons, shaders, texture packs, worlds, maps, skins, and creator uploads.

## Stack
- React + TypeScript + Vite
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Capacitor Android wrapper (com.zexo.app)
- GitHub repository: https://github.com/zexo-mods/zexo

The app now uses Supabase directly. The unused legacy Cloudflare Worker/D1/R2 backend has been removed from this repository.

## Connect Supabase
1. Run npm install.
2. Copy .env.example to .env.
3. In Supabase Dashboard → Project Settings → API Keys, copy the publishable key into VITE_SUPABASE_PUBLISHABLE_KEY. The project URL is already shown in the example.
4. Never put a database password, secret key, or service-role key in a Vite environment variable or GitHub commit.
5. Start with npm run dev.

## Supabase project
- Project ref: fwjbccoqrzjafbeecwwr
- Project URL: https://fwjbccoqrzjafbeecwwr.supabase.co
- Region: Singapore (ap-southeast-1)

The schema is in supabase/migrations/20261025000000_zexo_marketplace_initial_schema.sql and has been applied to the linked project. The creator submission policy is in supabase/migrations/20261025010000_creator_submit_for_moderation.sql and has also been applied. The database includes profiles, role assignments, creator profiles, categories, mods, file metadata, favorites, downloads, reports, notifications, and moderation audit tables. RLS is enabled on every public table. Storage buckets are mod-files (private) and mod-images (public).

## First admin and creator setup
1. Register your own account in the app and verify your email if confirmation is enabled.
2. In Supabase Dashboard → SQL Editor, replace YOUR_EMAIL and run:

    insert into public.user_roles(user_id, role)
    select id, 'admin' from auth.users where lower(email) = lower('YOUR_EMAIL')
    on conflict do nothing;

3. To grant creator access to another account, replace CREATOR_EMAIL and run:

    insert into public.user_roles(user_id, role)
    select id, 'creator' from auth.users where lower(email) = lower('CREATOR_EMAIL')
    on conflict do nothing;

4. Never allow users to edit their own roles. Admin and creator roles are managed separately from editable profile data.

## Implemented
- Public published-mod browsing and search use Supabase.
- Email/password sign-up and sign-in use Supabase Auth.
- New account profiles are created by a database trigger.
- Creator package uploads support .mcpack, .mcaddon, .mcworld, .mctemplate, and .zip, with a 100 MB limit and ZIP signature check.
- Creator submissions enter the admin moderation queue.
- Admin overview and approve/reject/request-changes actions use Supabase and record moderation logs.
- Private mod files are stored in the mod-files bucket; public thumbnails can use mod-images.
- Downloads use short-lived signed URLs and require a clean scan status.

## Still required before production
- Add your publishable key to local .env and verify Auth email settings and redirect URLs.
- Promote your owner account to admin using the SQL above.
- Implement and connect a trusted malware-scanning/quarantine service. Storage does not scan uploads automatically; do not set scan_status to clean without a real scan.
- Complete profile/favorites screens, detailed admin management pages, rate limits, and production deployment.
- Run and fix the full Vite/TypeScript build and test it on desktop and Android. No APK/AAB has been built or published by this integration step.

## Local development
    npm install
    cp .env.example .env
    npm run dev

For Android, after installing Android Studio and the Android SDK:
    npm run build
    npx cap add android
    npm run android:sync
    npm run android:open

Minecraft is a trademark of Mojang Studios. ZEXO is an independent community project and is not affiliated with Mojang or Microsoft.

# ZEXO

ZEXO is an Android-first Minecraft Bedrock community marketplace for add-ons, shaders, texture packs, worlds, maps, skins, and creator uploads.

## Stack
- React + TypeScript + Vite
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Capacitor Android wrapper (com.zexo.app)
- GitHub repository: https://github.com/zexo-mods/zexo

The active frontend data layer uses Supabase directly. Do not deploy the legacy Cloudflare Worker or D1/R2 code.

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

The initial schema is in supabase/migrations/20261025000000_zexo_marketplace_initial_schema.sql and has already been applied to the linked project. It creates profiles, role assignments, creators, categories, mods, file metadata, favorites, downloads, reports, notifications, and moderation audit tables. RLS is enabled on every public table. Storage buckets are mod-files (private) and mod-images (public).

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

4. Never allow users to edit their own roles.

## Current implementation status
- Public browsing and email/password authentication are wired to Supabase.
- Creator draft creation and admin overview queries use Supabase RLS.
- Creator upload UI, admin moderation actions, file scanning/quarantine, and production deployment still require implementation and testing.
- Uploaded files are limited to 100 MB. Storage does not scan files for malware by itself.
- Do not mark files as clean until a trusted scanning process has checked them. Downloads only return files with scan_status = clean.

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

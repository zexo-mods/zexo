# Zexo Client — Android Implementation Plan

**Date:** 2026-11-06  
**Status:** Draft for user approval  
**Product:** Zexo Client — Early Access  
**Target:** Android only; launcher first, integrated client later  
**Repository strategy:** Separate native Android repository, reusing the existing Zexo Supabase backend. The current `zexo-mods/zexo` marketplace remains untouched by app source code.

## 1. Product intent

Build a native Android launcher for Minecraft Bedrock / PE with a Flarial-inspired dark interface and green accents. The first release detects an existing official Minecraft installation and opens it through supported Android mechanisms. It adds local pack/profile tools, performance diagnostics, a curated online add-on library, and a basic add-on creator. Future integrated-client capabilities are represented in the architecture and UI roadmap, but are not falsely presented as available in Early Access.

## 2. Locked product decisions

- Separate native Android app; existing Zexo backend.
- Kotlin + Jetpack Compose; Minecraft launcher-style home; Flarial-inspired sidebar; minimal ZEXO wordmark with green accents.
- Latest stable Minecraft Bedrock version target; detect installed official Minecraft rather than bundling game files.
- Smart Play: launch official Minecraft in Early Access; add integrated client as a future supported target.
- English only; quick first-run wizard; optional Zexo account and guest mode.
- Private app storage by default plus optional user-selected folder through Android Storage Access Framework.
- Automatic update notifications with manual app installation.
- No server browser or multiplayer management.
- No skin editor. World and Skin Manager is limited to managing/importing existing supported items.
- Optional PIN/biometric app lock, safe file checks, permission controls, secure authentication, opt-in analytics, consent-first data collection, protected backups.
- Marketplace combines category/search browsing, detailed project pages, creator profiles, ratings/reviews, moderated uploads, and download queue/pause/resume/progress/Wi-Fi-only controls.
- Automatic compatibility checks; manual pack updates and user-approved installs.
- Balanced adaptive performance default.
- Crash detection, restore, pre-change backups, opt-in crash reports, safe mode, diagnostic logs.
- Full device benchmark and FPS tests only where measurable; report limitations and never fabricate values.
- Basic Add-on Creator: new project, metadata/icon editing, import/edit existing resource packs, texture replacement, UUID generation, .mcpack/.mcaddon export, preview.
- Resource-pack advanced editor scope remains undecided; do not silently expand it.
- Future HUD, crosshair, PvP tools, integrated client and advanced graphics hooks are roadmap items, not launcher promises.

## 3. Approaches considered

1. **Separate native Android app (selected):** clean Kotlin/Compose application, dedicated repository, shared Supabase backend. Best fit for Android storage, package detection, performance and future native client work; requires a separate app pipeline.
2. **Native module inside the existing marketplace repository:** keeps source in one repo but couples Android release cadence to the Next.js marketplace and increases build complexity.
3. **Extend the existing Capacitor app:** fastest reuse of the website shell, but core launcher features need native plugins and would create a more fragile web/native boundary.

## 4. Architecture

Use a single-activity Compose application with feature-oriented modules and MVVM/UDF state flow. Suggested initial Gradle modules:

- `:app`: application, root navigation, dependency graph.
- `:core:designsystem`: Zexo colors, typography, components, light/dark themes.
- `:core:common`: shared result/error types, dispatchers, utilities.
- `:core:database`: Room entities, DAOs, migrations.
- `:core:datastore`: user preferences and local configuration.
- `:core:security`: encrypted local secrets, app-lock policy, integrity checks.
- `:core:network`: HTTP client and connectivity handling.
- `:data`: repositories and local/remote data sources.
- `:feature:onboarding`, `:feature:home`, `:feature:performance`, `:feature:packs`, `:feature:profiles`, `:feature:worlds`, `:feature:marketplace`, `:feature:creator`, `:feature:settings`.

Use Navigation Compose, ViewModels, Kotlin coroutines/Flow, Room, DataStore, WorkManager, AndroidX biometric APIs and Storage Access Framework. Select and pin dependency versions at implementation time using current official docs; commit Gradle version catalog and wrapper. Do not assume unsupported third-party APIs.

### Android / Minecraft boundary

- Detect Minecraft by package visibility and PackageManager using only the minimum necessary visibility declarations.
- Use Android intents/package launch mechanisms for Play; handle missing/incompatible installation with clear guidance.
- Import user-selected .mcpack, .mcaddon and .mcworld files via SAF. Do not promise writing into another app's private directories.
- Any pack activation mechanism must be verified against current Bedrock Android behavior and official supported interfaces before implementation. If Android/Minecraft does not expose a reliable supported route, provide export/share/open-with workflow instead.
- No bundled Minecraft binaries, proprietary assets, bypasses, or modifications to the official game's protected installation.
- Performance monitoring must distinguish Zexo's own process/device telemetry from Minecraft's actual FPS. Cross-process FPS, ping and game telemetry are not assumed accessible.

### Supabase boundary

Reuse the existing project only after inspecting its schema, RLS, storage buckets, edge functions and auth settings. Use a publishable key in the Android client; never ship service-role/secret keys. Keep privileged moderation, scanning orchestration and signing operations server-side. Enable RLS on exposed tables and storage policies scoped to the actual ownership/publication model. Preserve existing marketplace data and policies; create additive, reviewed migrations only when necessary.

## 5. Delivery phases and tasks

### Phase 0 — Repository and integration baseline
1. Create a dedicated private/public GitHub repository named `zexo-client-android` only after confirming owner and visibility.
2. Add README, license decision placeholder, CONTRIBUTING, issue templates, .gitignore, Gradle wrapper and CI skeleton.
3. Inspect existing Supabase tables, policies, buckets, auth providers and edge functions; map existing marketplace models before proposing schema changes.
4. Add architecture decision records for Minecraft detection, pack import/export, and cross-process telemetry.
**Acceptance:** clean separate repository; no changes to marketplace runtime; backend integration map documented; no secrets committed.

### Phase 1 — Native foundation and visual system
1. Bootstrap Kotlin/Compose app with version catalog and reproducible Gradle build.
2. Implement dark/green Zexo design tokens, light/dark theme switching, responsive phone layout, sidebar navigation and accessible components.
3. Add onboarding wizard, guest-first entry, optional account entry point, settings and notification center shell.
4. Add Room/DataStore foundations and navigation/state tests.
**Acceptance:** app builds and launches on a supported Android emulator/device; navigation, theme and onboarding tests pass; no network required to open Home.

### Phase 2 — Launcher and Minecraft detection
1. Implement package detection with documented package visibility.
2. Implement Play state machine: detected → launch; missing → installation guidance; launch failure → recoverable error.
3. Add version/status display only when obtainable reliably; avoid claiming compatibility based on guesswork.
4. Add integration tests for installed, missing and launch-failure states.
**Acceptance:** Play opens the detected official Minecraft app; missing-install state never crashes; no game binaries are bundled.

### Phase 3 — Local library, packs, profiles and backups
1. Implement SAF import pipeline with MIME/extension validation and size limits.
2. Add local pack inventory, details, enablement/status metadata where supported, uninstall/remove-from-library, sorting and load-order UI only if Bedrock actually supports the required operation.
3. Add profile snapshots, export/import configuration, automatic backup before destructive pack operations and restore.
4. Add safe mode that disables Zexo-managed pack operations and recovers the launcher UI.
5. Add compatibility rules as transparent heuristics with unknown/unsupported states; no fabricated certainty.
**Acceptance:** valid files import; invalid/oversized files are rejected safely; backups restore; unsupported Bedrock operations are clearly explained.

### Phase 4 — Performance dashboard and benchmark
1. Implement device capability inventory and Zexo process memory/CPU diagnostics using supported Android APIs.
2. Add battery/thermal state and adaptive profile recommendations where APIs permit.
3. Implement repeatable benchmark workloads owned by Zexo and label them as device/app benchmarks, not Minecraft FPS.
4. Show actual FPS only when a legitimate supported measurement source exists; otherwise show “Unavailable”.
5. Add render-distance/graphics recommendations as user guidance, not unsupported remote control.
**Acceptance:** values are sourced, timestamped and labeled; unavailable readings remain unavailable; benchmark results are repeatable within documented tolerances.

### Phase 5 — Supabase accounts and marketplace
1. Integrate the verified Supabase Kotlin client with Auth, Postgrest and Storage modules; pin versions and document session persistence.
2. Support optional sign-in; guest users can use local features.
3. Read existing public marketplace data models and reuse them where appropriate; do not duplicate listings unnecessarily.
4. Implement search, categories, project detail, creator profiles, reviews/ratings and download queue.
5. Add pause/resume/progress and Wi-Fi-only policy for downloads; verify checksums and validate archive structure before offering import.
6. Ensure community uploads remain pending moderation and respect existing admin approval flow.
7. Add consent-based analytics and opt-in crash upload; no personal data collection by default.
**Acceptance:** guest mode works offline for local features; authenticated operations obey RLS; public data is read-only as designed; no privileged key exists in APK; download/import errors are recoverable.

### Phase 6 — Basic Add-on Creator
1. Create project and metadata editing models.
2. Import an existing resource pack and safely inspect manifest/texture structure.
3. Implement supported texture replacement with preview.
4. Generate unique pack/header/module UUIDs with validation.
5. Export valid .mcpack and .mcaddon archives; preview before export.
6. Add fixture-based archive/manifest tests and round-trip import/export tests.
**Acceptance:** exported packs pass structural validation and can be opened by supported Minecraft workflows; malformed archives cannot crash the app.

### Phase 7 — Hardening and Early Access
1. Add crash recovery, diagnostic logs, optional report consent and log redaction.
2. Add biometric/PIN lock, permission education and backup protection.
3. Add automatic update checks and notifications; installation remains user initiated.
4. Run device matrix tests, accessibility checks, performance profiling, dependency/security checks and Supabase advisors.
5. Produce signed test APK through protected CI secrets; never commit signing keys.
**Acceptance:** release checklist signed off; no critical/high security findings unresolved; clean install, upgrade and rollback paths tested.

## 6. Test strategy

- Unit tests for repositories, compatibility rules, UUID generation, archive validation, profile serialization and launch state machine.
- Compose UI tests for onboarding, navigation, themes, empty/error/loading states and accessibility semantics.
- Instrumentation tests for SAF import/export, Room migrations, biometric fallback and package detection.
- Backend tests for Auth, RLS ownership boundaries, public listing access, moderation state and Storage policies.
- Physical-device testing across low/mid/high Android hardware; benchmark numbers must identify device, Android version, test duration and thermal/battery context.
- CI: formatting/lint, unit tests, assembleDebug; release signing only via protected secrets.

## 7. Risks and explicit non-goals

- Bedrock Android does not provide a general public API for an external launcher to inject arbitrary client modifications or control every game setting. Integrated client, HUD, crosshair, CPS, ping and PvP overlays require a separate feasibility/security review.
- Android scoped storage limits direct management of Minecraft private data. SAF-based import/export is the safe baseline.
- Other-app FPS and GPU telemetry may be unavailable; do not infer or fabricate.
- Marketplace file scanning requires server-side scanning or a vetted scanner; client-side extension checks are not malware scanning.
- No server list, server tools, skin editor, Minecraft binary distribution, anti-cheat bypass, or unsupported game patching.
- Advanced resource-pack editor is out of scope until the user decides.

## 8. Open decisions for implementation

- GitHub repository owner and visibility for `zexo-client-android`.
- Minimum supported Android version / SDK range.
- Whether resource-pack editing beyond the Basic Add-on Creator is wanted.
- Exact supported Minecraft package/version detection rules after testing.
- Which existing Supabase tables/buckets can safely serve the Android marketplace without schema changes.

## 9. Documentation references checked

- Android Jetpack Compose / Navigation / architecture guidance: https://developer.android.com/develop/ui/compose
- Supabase Kotlin client documentation: https://github.com/supabase-community/supabase-kt
- Existing Zexo marketplace README: https://github.com/zexo-mods/zexo/blob/main/README.md

---
**Approval gate:** This plan is a proposal. Do not create the Android repository, change Supabase schema/policies, scaffold the app, or write product code until the user approves this plan and chooses an execution approach.

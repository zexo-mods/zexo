# Zexo Client for Android

A separate native Android companion client for Minecraft Bedrock Edition.

## Current foundation

- Kotlin + Jetpack Compose + Material 3.
- Dark interface with Zexo green accents.
- Home dashboard and installed Minecraft launch action.
- PvP, HUD, visual and utility module preset screens.
- Android Storage Access Framework file picker for .mcpack / .mcaddon handoff.
- Unit tests for the local module catalog.

## Important integration boundary

This project does not inject code into Minecraft, modify its process, or replace the official game engine. The module switches in version 0.1.0 are local UI presets only. Actual in-game behavior must use supported Bedrock resource-pack, behavior-pack and Script API capabilities. Features unavailable through those interfaces will not be represented as working.

## Build

Open this directory in Android Studio with JDK 17 and Android SDK 36 installed, then sync Gradle and run the app configuration.

Run unit tests with: gradle :app:testDebugUnitTest

Build a debug APK with: gradle :app:assembleDebug

## Backend

The existing Zexo marketplace remains separate and unchanged. Supabase authentication and cloud profile sync are not wired in this initial foundation; first verify the existing project schema and row-level security policies. Never place a Supabase secret/service-role key in the Android app. Only a publishable/anon key may be shipped in a client, subject to correct RLS.

## Roadmap

1. Native Android shell and navigation.
2. Reliable .mcpack / .mcaddon import handoff.
3. Persistent module profiles and HUD configuration.
4. Supported Bedrock resource-pack and Script API integrations.
5. Supabase authentication and cloud sync.
6. Add-on creator and device benchmark tools.

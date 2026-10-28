import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.zexo.mods',
  appName: 'ZEXO',
  webDir: 'www',
  server: {
    // ZEXO is hosted on Cloudflare Workers. The Android shell loads the live website,
    // so web updates can ship without rebuilding the APK.
    url: 'https://zexo.zexomods.workers.dev',
    cleartext: false,
    allowNavigation: ['zexo.zexomods.workers.dev'],
  },
  android: {
    allowMixedContent: false,
  },
}

export default config

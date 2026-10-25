import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { zexo: { ink: '#080808', panel: '#111111', line: '#262626', red: '#ef4444' } }, boxShadow: { glow: '0 0 40px rgba(239,68,68,.12)' } } },
  plugins: [],
}
export default config

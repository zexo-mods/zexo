import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { red: {"50":"#effaff","100":"#dff5ff","200":"#b8eaff","300":"#7dd8ff","400":"#38bdf8","500":"#0ea5e9","600":"#0284c7","700":"#0369a1","800":"#075985","900":"#0c4a6e","950":"#082f49"}, zexo: { ink: '#080B12', panel: '#111827', line: '#263244', red: '#38BDF8', blue: '#38BDF8', cyan: '#22D3EE' } }, boxShadow: { glow: '0 0 40px rgba(56,189,248,.12)' } } },
  plugins: [],
}
export default config

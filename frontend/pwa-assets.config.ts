import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera los íconos de la PWA desde public/logo.svg: npm run icons
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#256abf' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#256abf' } },
  },
  images: ['public/logo.svg'],
})

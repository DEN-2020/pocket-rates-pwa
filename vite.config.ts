import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const repositoryName = 'pocket-rates-pwa';

  return {
    base: mode === 'pages' ? `/${repositoryName}/` : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'brand/logo-mark.svg'],
        manifest: {
          id: '.',
          name: 'Pocket Rates',
          short_name: 'Pocket Rates',
          description: 'Fast mobile-first currency and crypto converter.',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '.',
          scope: '.',
          theme_color: '#0b0d10',
          background_color: '#0b0d10',
          categories: ['finance', 'utilities'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
        }
      })
    ],
    build: {
      target: 'es2022',
      sourcemap: true
    }
  };
});

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
        manifest: {
          name: 'Pocket Rates',
          short_name: 'Rates',
          description: 'Fast mobile-first currency and crypto converter.',
          display: 'standalone',
          start_url: '.',
          scope: '.',
          theme_color: '#0b0d10',
          background_color: '#0b0d10'
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html'
        }
      })
    ],
    build: {
      target: 'es2022',
      sourcemap: true
    }
  };
});

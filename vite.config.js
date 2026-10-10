import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/* Two build targets share this config:
     npm run build         -> web/Vercel, PWA + service worker enabled
     npm run build:native  -> assets bundled into the Capacitor APK, NO service worker

   The service worker is deliberately omitted from the native build. Inside a
   Capacitor WebView the assets are already local, so a SW adds nothing — but
   its precache outlives an APK upgrade, so it can keep serving the previous
   JS bundle after a user installs a new version. Dropping the plugin also
   drops the registerSW.js that it injects into index.html. */
export default defineConfig(({ mode }) => {
  const isNative = mode === 'native'

  return {
    // relative so assets resolve against the WebView's local origin;
    // also fine on Vercel, where the app is served from the root
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      ...(isNative
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['apple-touch-icon.png'],
              devOptions: {
                enabled: true,
                type: 'module',
              },
              manifest: {
                name: 'IronMap',
                short_name: 'IronMap',
                description: 'Home-gym resistance tracker — log sets, see weekly muscle volume, close gaps.',
                theme_color: '#14171C',
                background_color: '#14171C',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                  { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: {
                // woff2 included so the self-hosted display font is available
                // offline on the web PWA too, not just in the APK
                globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
              },
            }),
          ]),
    ],
  }
})

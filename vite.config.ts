import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // In local dev, forward /supabase/* → real Supabase URL
      // This mirrors what the Cloudflare Worker does in production.
      "/supabase": {
        target: "https://wxnxmglyularlfughmen.supabase.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ""),
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.jpeg', 'logo.jpeg'],
      manifest: {
        name: 'INNOVESTOR',
        short_name: 'Innovestor',
        description: 'Connecting Innovators with Investors',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/database'
    ],
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/database'],
        }
      }
    }
  }
}));


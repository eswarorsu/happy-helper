import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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


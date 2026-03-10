// Supabase client — routes all traffic through a reverse proxy to bypass
// ISP-level DNS blocks on *.supabase.co.
//
// LOCAL DEV:
//   Requests go to  http://localhost:8080/supabase/*
//   Vite's server.proxy forwards them to the real Supabase URL.
//
// PRODUCTION (Vercel / any CDN):
//   Set VITE_SUPABASE_PROXY_URL to your Cloudflare Worker URL, e.g.
//     VITE_SUPABASE_PROXY_URL=https://innovestor-supabase-proxy.YOUR-SUBDOMAIN.workers.dev/supabase
//   Then all requests go to  <worker>/supabase/<path>  and the worker
//   forwards them to the real Supabase project.
//
// FALLBACK:
//   If VITE_SUPABASE_PROXY_URL is not set (e.g. before the worker is deployed),
//   the client falls back to the raw VITE_SUPABASE_URL so you are never broken.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── URL resolution ───────────────────────────────────────────────────────────

/**
 * In local dev:  window.location.origin + "/supabase"  →  http://localhost:8080/supabase
 * In production: VITE_SUPABASE_PROXY_URL  (your Cloudflare Worker URL)
 * Fallback:      direct Supabase URL (if proxy not yet deployed)
 */
function resolveSupabaseUrl(): string {
  // 1. Explicit proxy URL set via .env (Cloudflare Worker or any other proxy)
  const explicitProxy = import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined;
  if (explicitProxy && explicitProxy.startsWith("http")) {
    return explicitProxy;
  }

  // 2. In local dev, piggyback on Vite's built-in server.proxy
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/supabase`;
  }

  // 3. Direct URL fallback (used in production before worker is deployed)
  const direct = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (direct && direct.startsWith("http")) {
    return direct;
  }

  console.error(
    "[supabase/client] No Supabase URL configured. " +
    "Set VITE_SUPABASE_PROXY_URL (Cloudflare Worker) or VITE_SUPABASE_URL in your .env file."
  );
  return "https://placeholder-url.supabase.co";
}

const SUPABASE_URL = resolveSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string || "";

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[supabase/client] Missing VITE_SUPABASE_PUBLISHABLE_KEY. " +
    "Check your .env file or Vercel environment variables."
  );
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY || "placeholder-key",
  {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
/**
 * INNOVESTOR — Supabase Reverse Proxy (Cloudflare Worker)
 *
 * PURPOSE:
 *   Routes all Supabase traffic through a Cloudflare Worker so that
 *   clients behind ISP-level DNS blocks (e.g. *.supabase.co) can still
 *   reach the backend.
 *
 * HOW IT WORKS:
 *   1. Your frontend calls  https://<worker>.workers.dev/supabase/<path>
 *   2. This worker strips the /supabase prefix and forwards the request
 *      to  https://wxnxmglyularlfughmen.supabase.co/<path>
 *   3. The response (headers + body) is returned verbatim to the browser.
 *
 * SECURITY NOTES:
 *   • The Anon key stays in the browser — that is intentional and consistent
 *     with Supabase's design (it is protected by Row Level Security).
 *   • NEVER put your SERVICE ROLE key in the frontend.
 *   • The CORS "allowedOrigins" list below ensures only your own domains
 *     can access this proxy (prevents third-party abuse).
 *
 * DEPLOY:
 *   cd cloudflare-proxy
 *   npm install -g wrangler   (or npx wrangler)
 *   wrangler login
 *   wrangler deploy
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Your actual Supabase project URL (the one that is DNS-blocked). */
const SUPABASE_URL = "https://wxnxmglyularlfughmen.supabase.co";

/**
 * Allowed frontend origins. Add your Vercel deployment URLs here.
 * Use "*" during LOCAL TESTING ONLY — restrict to real domains in production.
 */
const ALLOWED_ORIGINS: string[] = [
    "http://localhost:8080",
    "http://localhost:3000",
    "https://innovestor.vercel.app",   // ← replace with your real Vercel URL
    // Add any custom domain you own here, e.g.:
    // "https://www.innovestor.in",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Env {
    // You can optionally pin the target URL as a Cloudflare secret instead of
    // hardcoding it. Set via: wrangler secret put SUPABASE_TARGET_URL
    SUPABASE_TARGET_URL?: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const targetBase = env.SUPABASE_TARGET_URL ?? SUPABASE_URL;
        const origin = request.headers.get("Origin") ?? "";

        // ── CORS pre-flight ───────────────────────────────────────────────────────
        if (request.method === "OPTIONS") {
            return makeCorsResponse(origin, new Response(null, { status: 204 }));
        }

        // ── Path rewrite ──────────────────────────────────────────────────────────
        // The frontend sends requests to:
        //   /supabase/auth/v1/token      →  targetBase/auth/v1/token
        //   /supabase/rest/v1/profiles   →  targetBase/rest/v1/profiles
        //   /supabase/realtime/v1/...    →  targetBase/realtime/v1/...
        const url = new URL(request.url);
        const pathname = url.pathname; // e.g. /supabase/rest/v1/profiles

        const PROXY_PREFIX = "/supabase";
        if (!pathname.startsWith(PROXY_PREFIX)) {
            return new Response("Not found", { status: 404 });
        }

        const supabasePath = pathname.slice(PROXY_PREFIX.length); // → /rest/v1/profiles
        const targetUrl = `${targetBase}${supabasePath}${url.search}`;

        // ── Clone + sanitize request headers ─────────────────────────────────────
        const requestHeaders = new Headers(request.headers);

        // Remove headers that would confuse the upstream or expose the proxy
        requestHeaders.delete("host");
        // Keep everything else: Authorization (anon key), apikey, content-type,
        // x-client-info, range, prefer, etc.

        // ── Forward the request ───────────────────────────────────────────────────
        let upstreamResponse: Response;
        try {
            upstreamResponse = await fetch(targetUrl, {
                method: request.method,
                headers: requestHeaders,
                body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
                // Required for streaming bodies (e.g. file uploads)
                // @ts-ignore – duplex is not yet in the TS lib but CF Workers support it
                duplex: "half",
            });
        } catch (err) {
            return makeCorsResponse(
                origin,
                new Response(
                    JSON.stringify({ error: "Proxy could not reach Supabase", detail: String(err) }),
                    { status: 502, headers: { "Content-Type": "application/json" } }
                )
            );
        }

        // ── Clone + sanitize response headers ────────────────────────────────────
        const responseHeaders = new Headers(upstreamResponse.headers);

        // Strip Supabase's own CORS headers so we can set our own correctly
        responseHeaders.delete("access-control-allow-origin");
        responseHeaders.delete("access-control-allow-methods");
        responseHeaders.delete("access-control-allow-headers");
        responseHeaders.delete("access-control-expose-headers");
        responseHeaders.delete("access-control-max-age");

        // ── Build proxied response ────────────────────────────────────────────────
        const proxied = new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders,
        });

        return makeCorsResponse(origin, proxied);
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attaches the correct CORS headers to any Response.
 * Only allows origins listed in ALLOWED_ORIGINS (or * for OPTIONS pre-flight).
 */
function makeCorsResponse(origin: string, response: Response): Response {
    const isAllowed =
        ALLOWED_ORIGINS.includes(origin) ||
        // Allow any *.vercel.app preview URL automatically
        /^https:\/\/[a-z0-9-]+-[a-z0-9]+\.vercel\.app$/.test(origin);

    const allowOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    headers.set(
        "Access-Control-Allow-Headers",
        "authorization, x-client-info, apikey, content-type, range, prefer, accept-profile, content-profile, x-upsert, accept"
    );
    headers.set("Access-Control-Expose-Headers", "content-range, x-supabase-api-version");
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

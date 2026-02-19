console.log("🚀 INDEX.JS STARTED");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";

dotenv.config();

// ============================================================================
// SECURITY: Validate required environment variables at startup
// OWASP ASVS 2.10.1 – fail fast if secrets are missing
// ============================================================================
const REQUIRED_ENV = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("   Server will start but affected routes will return 500 until fixed.");
}

const app = express();

// ============================================================================
// SECURITY: Trust proxy (needed on Render / Railway / Heroku / Vercel)
// Allows express-rate-limit to read the real client IP from X-Forwarded-For
// rather than the load-balancer's IP. Set to the number of trusted proxy hops.
// ============================================================================
app.set("trust proxy", 1);

// ============================================================================
// SECURITY: HTTP Security Headers via Helmet (OWASP A05:2021)
// Sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// Content-Security-Policy (restrictive default), and more.
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],       // deny everything by default
      frameAncestors: ["'none'"],   // clickjacking protection (replaces X-Frame-Options)
    },
  },
}));

// ============================================================================
// SECURITY: CORS – only allow the known frontend origin (OWASP A05:2021)
// Set ALLOWED_ORIGIN in your .env to the production frontend URL.
// Falls back to localhost for local dev when the env var is absent.
// ============================================================================
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (same-origin / curl / Postman in dev)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ============================================================================
// SECURITY: Body size limit – prevent DoS via large payloads (OWASP A06:2021)
// 10 KB is more than enough for our JSON payloads.
// ============================================================================
app.use(express.json({ limit: "10kb" }));

// ============================================================================
// SECURITY: Global rate limiter – 100 requests per 15 minutes per IP
// Acts as a catch-all backstop for any unlisted routes. (OWASP A04:2021)
// ============================================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,     // Disable X-RateLimit-* headers
  message: { error: "Too many requests. Please try again later." },
  // With trust proxy enabled, req.ip is already the real client IP (IPv4 or IPv6)
});
app.use(globalLimiter);

app.use("/api/payment", paymentRoutes);

// ============================================================================
// Global error handler – return JSON, never leak stack traces to clients
// ============================================================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors come here as well
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ✅ CORRECT PORT HANDLING FOR RENDER
const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// 🔴 CATCH SERVER ERRORS
server.on("error", (err) => {
  console.error("❌ SERVER ERROR:", err);
});




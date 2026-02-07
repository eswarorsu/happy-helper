import { createClient } from "@supabase/supabase-js";

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header using Supabase
 */
const createAuthMiddleware = () => {
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("⚠️ SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Auth middleware will reject all requests.");
    }

    const supabase = supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        : null;

    return async (req, res, next) => {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Unauthorized: No token provided" });
            }

            const token = authHeader.split(" ")[1];

            if (!supabase) {
                return res.status(500).json({ error: "Auth service not configured" });
            }

            // Verify token with Supabase
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                console.error("Auth error:", error?.message);
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }

            // Attach user to request for downstream use
            req.user = user;
            next();
        } catch (err) {
            console.error("Auth middleware error:", err);
            return res.status(500).json({ error: "Authentication failed" });
        }
    };
};

export default createAuthMiddleware;

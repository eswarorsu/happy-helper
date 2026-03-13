import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/ or from root
dotenv.config(); 
dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("✅ Environment variables loaded");
if (process.env.SUPABASE_URL) console.log("✅ SUPABASE_URL found");
if (process.env.SUPABASE_SERVICE_KEY) console.log("✅ SUPABASE_SERVICE_KEY found");
if (process.env.CASHFREE_APP_ID) console.log("✅ CASHFREE_APP_ID found");

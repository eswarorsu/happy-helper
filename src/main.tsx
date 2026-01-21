import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

const isEnvValid =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!isEnvValid) {
    createRoot(rootElement).render(
        <div style={{
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            color: '#ef4444',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            margin: '40px auto',
            maxWidth: '600px'
        }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Configuration Error
            </h1>
            <p style={{ marginBottom: '16px' }}>
                Missing required environment variables (Supabase URL or Key).
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your Vercel settings.
            </p>
        </div>
    );
} else {
    createRoot(rootElement).render(<App />);
}

// Types for Investor Dashboard MVP

export interface FounderProfile {
    id: string;
    name: string;
    current_job?: string | null;
    education?: string | null;
    experience?: string | null;
    linkedin_profile?: string | null;
    avatar_url?: string | null;
    email?: string;
    upi_id?: string | null; // Added UPI ID field
}

export interface WeeklyLog {
    id: string;
    idea_id: string;
    content: string;
    media_url?: string | null;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

export interface IdeaWithFounder {
    id: string;
    title: string;
    description: string;
    domain: string;
    investment_needed: number;
    investment_received: number | null;
    status: string | null;
    media_url?: string | null;
    website_url?: string | null;
    linkedin_url?: string | null;
    market_size?: string | null;
    traction?: string | null;
    team_size?: string | null;
    work_mode?: string | null;
    founder_city?: string | null;
    founder_phone?: string | null;
    created_at: string;
    founder_id: string;
    founder?: FounderProfile;
}

// Trending domains that get highlighted
export const TRENDING_DOMAINS = [
    "AI",
    "FinTech",
    "HealthTech",
    "SaaS",
    "EV",
    "EdTech",
    "CleanTech",
    "DeepTech",
    "Web3",
    "Blockchain"
];

// Map status to readable stage
export function getStageFromStatus(status: string | null): {
    label: string;
    variant: "idea" | "early" | "running";
} {
    switch (status) {
        case "pending":
        case "approved":
            return { label: "Idea Stage", variant: "idea" };
        case "in_progress":
        case "communicating":
            return { label: "Early Stage", variant: "early" };
        case "funded":
        case "deal_done":
        case "completed":
            return { label: "Running", variant: "running" };
        default:
            return { label: "Idea Stage", variant: "idea" };
    }
}

// Check if domain is trending
export function isTrendingDomain(domain: string): boolean {
    return TRENDING_DOMAINS.some(
        (trending) => domain.toLowerCase().includes(trending.toLowerCase())
    );
}

// Format currency for display
export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "₹0";
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
}

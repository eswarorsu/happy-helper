// ─── SHARED CONSTANTS ───────────────────────────────────────────
export const STATUS_OPTIONS = ["Student", "Final Year Student", "Graduate", "Working Professional"];

// ─── FOUNDER STEP DEFINITIONS ───────────────────────────────────
export const FOUNDER_STEPS = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Professional Info" },
  { id: 3, label: "Contact & Socials" },
  { id: 4, label: "Startup Context" },
];

export const STARTUP_STAGES = [
  { value: "idea", label: "Idea Stage", sub: "Just starting, validating the concept" },
  { value: "mvp", label: "MVP / Prototype", sub: "Built something, gathering feedback" },
  { value: "traction", label: "Early Traction", sub: "Have users or first revenue" },
  { value: "growth", label: "Growth Stage", sub: "Scaling with consistent revenue" },
  { value: "scaling", label: "Scaling Up", sub: "Expanding team & markets" },
];

export const DISCOVERY_OPTIONS = [
  "Google / Search", "LinkedIn", "Twitter / X", "Friend or colleague referral",
  "Blog / Article", "YouTube", "Product Hunt", "Business school / Accelerator",
  "VC / Investor recommendation", "Other",
];

export const PRIMARY_GOALS = [
  "Validate idea", "Improve investor readiness", "Get mentor feedback",
  "Benchmark competition", "Build reporting discipline",
];

export const BIGGEST_CHALLENGES = [
  "Finding PMF", "Customer acquisition", "Fundraising narrative",
  "Unit economics", "Team execution", "Go-to-market clarity",
];

export const DECISION_TIMELINES = ["This week", "2-4 weeks", "1-3 months", "Quarter+"];

export const FUNDING_STATUS_OPTIONS = ["Bootstrapped", "Pre-seed", "Seed", "Series A+", "Revenue-funded"];

// ─── INVESTOR STEP DEFINITIONS ──────────────────────────────────
import { User, Briefcase, Target, ShieldCheck } from "lucide-react";

export const INVESTOR_STEPS = [
  { id: 1, label: "Personal Identity", icon: User },
  { id: 2, label: "Professional Background", icon: Briefcase },
  { id: 3, label: "Investment Profile", icon: Target },
  { id: 4, label: "Verification", icon: ShieldCheck },
];

export const INVESTOR_TYPES = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capitalist" },
  { value: "individual", label: "Individual Investor" },
  { value: "family_office", label: "Family Office" },
  { value: "hni", label: "High Net Worth Individual" },
];

export const INVESTMENT_RANGES = [
  { value: "1L-10L", label: "₹1 Lakh - ₹10 Lakhs" },
  { value: "10L-50L", label: "₹10 Lakhs - ₹50 Lakhs" },
  { value: "50L-1Cr", label: "₹50 Lakhs - ₹1 Crore" },
  { value: "1Cr-5Cr", label: "₹1 Crore - ₹5 Crores" },
  { value: "5Cr+", label: "₹5 Crores+" },
];

export const PREFERRED_STAGES = ["Pre-Seed", "Seed", "Series A", "Growth", "Late Stage"];

export const DOMAINS = [
  "AI/ML", "Fintech", "HealthTech", "EdTech", "SaaS",
  "E-commerce", "CleanTech", "AgriTech", "Web3", "Gaming", "Other",
];

export const ROI_TIMELINES = [
  { value: "1-3years", label: "1-3 Years" },
  { value: "3-5years", label: "3-5 Years" },
  { value: "5+years", label: "5+ Years" },
];

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    TrendingUp,
    ExternalLink,
    FileText,
    Globe,
    Linkedin,
    Users,
    Target,
    Lightbulb,
    BarChart3,
    Pencil,
    Rocket,
    Link as LinkIcon,
    Search
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { WeeklyLogSheet } from "@/components/WeeklyLogSheet";
import {
    IdeaWithFounder,
    getStageFromStatus,
    isTrendingDomain,
    WeeklyLog
} from "@/types/investor";
import { cn } from "@/lib/utils";
import FinancialSummary from "@/components/investor/FinancialSummary";
import FounderProfile from "@/components/investor/FounderProfile";
import { ActivityTimerBadge } from "@/components/ActivityTimerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Equalizer } from "@/components/ui/equalizer";
import { CheckCircle2, LogOut, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { IdeaProductSection } from "@/components/IdeaProductSection";

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Idea Detail Page - Scrollable view with complete information
 * Order: Problem → Solution → Market → Business Model → Financials → Founder → Links
 */
export default function IdeaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [idea, setIdea] = useState<IdeaWithFounder | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalInvested, setTotalInvested] = useState(0);
    const [isFounder, setIsFounder] = useState(false);
    const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
    const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<"details" | "products">("details");

    useEffect(() => {
        if (!id) return;

        const fetchIdea = async () => {
            // Check authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Redirect to auth with return URL
                navigate(`/auth?returnUrl=${encodeURIComponent(location.pathname)}`);
                return;
            }

            // Fetch idea with founder profile
            const { data: ideaData, error } = await supabase
                .from("ideas")
                .select(
                    `
          *,
          founder:profiles!ideas_founder_id_fkey(
            id, name, current_job, education, experience, 
            linkedin_profile, avatar_url, email
          )
        `
                )
                .eq("id", id)
                .single();

            if (error || !ideaData) {
                console.error("Error fetching idea:", error);
                navigate("/investor-dashboard");
                return;
            }

            setIdea(ideaData as IdeaWithFounder);

            // Fetch total invested
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: investments } = await (supabase as any)
                .from("investment_records")
                .select("amount")
                .eq("idea_id", id)
                .eq("status", "confirmed");

            if (investments) {
                const total = investments.reduce((sum: number, inv: { amount: number }) => sum + Number(inv.amount), 0);
                setTotalInvested(total);
            }

            // Check if current user is founder
            const { data: viewerProfile } = await supabase
                .from("profiles")
                .select("id, user_type, name, is_approved, avatar_url")
                .eq("user_id", session.user.id)
                .single();

            if (viewerProfile) {
                // Type assertion here because we selected specific fields but Profile expects all
                // In a real app we might want a Partial<Profile> or Pick<Profile, ...>
                setProfile(viewerProfile as unknown as Profile);
                const isCurrentUserFounder = viewerProfile.id === ideaData.founder_id;
                setIsFounder(isCurrentUserFounder);

                // Record view for investors
                if (viewerProfile.user_type === "investor" && !isCurrentUserFounder) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabase as any).from("view_logs").insert({
                        viewer_id: viewerProfile.id,
                        idea_id: id
                    });

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error: notifError } = await (supabase as any).from("notifications").insert({
                        user_id: ideaData.founder_id,
                        title: "Idea Viewed! 👁️",
                        message: `${viewerProfile.name} (Investor) viewed your idea: ${ideaData.title}`,
                        type: "view",
                        redirect_url: `/idea/${id}`
                    });

                    if (notifError) {
                        console.error("View Notification Failed:", notifError);
                    } else {
                        console.log("View Notification Sent to Founder");
                    }
                }
            }

            // Fetch weekly logs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: logs } = await (supabase as any)
                .from("weekly_logs")
                .select("*")
                .eq("idea_id", id)
                .order("created_at", { ascending: false });

            setWeeklyLogs(logs || []);
            setLoading(false);
        };

        fetchIdea();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!idea) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Idea not found</p>
            </div>
        );
    }

    const stage = getStageFromStatus(idea.status);
    const isTrending = isTrendingDomain(idea.domain);
    const timerMultiplier = isLogSheetOpen ? 1.5 : 1.0;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    // Parse description for problem/solution (simple split by paragraph)
    const descriptionParts = idea.description.split("\n\n");
    const problemStatement = descriptionParts[0] || idea.description;
    const solutionExplanation =
        descriptionParts.slice(1).join("\n\n") || "See pitch deck for detailed solution.";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
            {/* Founder Portal Header - ONLY for Founder */}
            {isFounder && (
                <motion.header
                    className="bg-background/80 backdrop-blur-md border-b border-border/60 px-6 py-4 sticky top-0 z-50 shrink-0"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate("/founder-dashboard")}
                            whileHover={{ scale: 1.01 }}
                        >
                            <Logo size="sm" />
                            <div>
                                <h1 className="text-lg font-bold text-foreground tracking-tight">INNOVESTOR</h1>
                                <p className="text-xs text-muted-foreground font-medium">Founder Portal</p>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-4">
                            {profile?.is_approved && (
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                    </Badge>

                                    <ActivityTimerBadge
                                        profileId={profile?.id}
                                        isApproved={profile?.is_approved}
                                        multiplier={timerMultiplier}
                                    />
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/profile")}
                                className="text-muted-foreground hover:text-foreground hidden sm:flex"
                            >
                                <UserIcon className="w-4 h-4 mr-2" /> Profile
                            </Button>
                            <div className="w-px h-6 bg-border hidden sm:block" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                            <Avatar className="w-10 h-10 border-2 border-white ring-2 ring-brand-yellow/20 shadow-md">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-brand-yellow text-brand-charcoal font-bold text-lg">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </motion.header>
            )}

            {!isFounder && (
                <motion.header
                    className="bg-background/80 backdrop-blur-md border-b border-border/60 px-6 py-4 sticky top-0 z-50 shrink-0"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate("/investor-dashboard")}
                            whileHover={{ scale: 1.01 }}
                        >
                            <Logo size="sm" />
                            <div>
                                <h1 className="text-lg font-bold text-foreground tracking-tight">INNOVESTOR</h1>
                                <p className="text-xs text-muted-foreground font-medium">Idea Spotlight</p>
                            </div>
                        </motion.div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/marketplace")}
                                className="rounded-xl font-bold border-slate-200"
                            >
                                <Search className="w-4 h-4 mr-2" /> Browse More
                            </Button>
                        </div>
                    </div>
                </motion.header>
            )}

            {/* Sub-header with Back Button and Idea Badges */}
            <div className={cn(
                "bg-white border-b border-slate-200 px-6 py-3 text-slate-900 shadow-sm sticky z-40 transition-all duration-300",
                "top-[73px]"
            )}>
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(isFounder ? "/founder-dashboard" : "/investor-dashboard")}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>

                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveDetailTab("details")}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeDetailTab === "details"
                                    ? "bg-white text-brand-charcoal shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Idea Details
                            </button>
                            <button
                                onClick={() => setActiveDetailTab("products")}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeDetailTab === "products"
                                    ? "bg-white text-brand-charcoal shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Products Launched
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isTrending && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className={`${stage.variant === "running"
                                ? "text-green-700 border-green-300"
                                : stage.variant === "early"
                                    ? "text-blue-700 border-blue-300"
                                    : "text-muted-foreground border-border"
                                }`}
                        >
                            {stage.label}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {activeDetailTab === "details" ? (
                    <div className="space-y-8">
                        {/* Section 1: Title & Domain */}
                        <section>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                {idea.domain}
                            </p>
                            <h1 className="text-2xl font-bold text-foreground mb-2">{idea.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                Founded by{" "}
                                <span className="font-medium">{idea.founder?.name || "Unknown"}</span>
                            </p>
                        </section>

                        {/* Section 2: Problem Statement */}
                        <section className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-brand-charcoal" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Problem Statement
                                </h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-base">{problemStatement}</p>
                        </section>

                        {/* Section 3: Solution / Idea Explanation */}
                        <section className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Solution / Idea
                                </h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base">
                                {solutionExplanation}
                            </p>
                        </section>

                        {/* Section 4: Market & Domain Relevance */}
                        <section className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-brand-charcoal" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Market & Domain Relevance
                                </h2>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500 font-medium">Domain</span>
                                    <span className="font-bold text-slate-900">{idea.domain}</span>
                                </div>
                                {idea.market_size && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Market Size</span>
                                        <span className="font-bold text-slate-900">{idea.market_size}</span>
                                    </div>
                                )}
                                {idea.traction && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Current Traction</span>
                                        <span className="font-bold text-slate-900">{idea.traction}</span>
                                    </div>
                                )}
                                {idea.work_mode && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Work Mode</span>
                                        <span className="font-bold text-slate-900 capitalize">{idea.work_mode}</span>
                                    </div>
                                )}
                                {idea.founder_city && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Founder Location</span>
                                        <span className="font-bold text-slate-900">{idea.founder_city}</span>
                                    </div>
                                )}
                                {idea.team_size && (
                                    <div className="flex justify-between pt-1">
                                        <span className="text-slate-500 font-medium">Team Size</span>
                                        <span className="font-bold text-slate-900 flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            {idea.team_size}
                                        </span>
                                    </div>
                                )}
                                {!idea.market_size && !idea.traction && !idea.team_size && (
                                    <p className="text-slate-400 italic text-xs">
                                        Detailed market data available in pitch deck.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Section 5: Business Model */}
                        <section className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-brand-charcoal" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Business Model
                                </h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-base">
                                Business model details are available in the pitch deck. Key metrics and
                                revenue projections can be discussed after connecting with the founder.
                            </p>
                            {idea.media_url && (
                                <a
                                    href={idea.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    View Pitch Deck
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </section>

                        {/* Section 6: Detailed Financials */}
                        <section>
                            <FinancialSummary
                                fundsNeeded={idea.investment_needed}
                                fundsSecured={idea.investment_received}
                                totalInvested={totalInvested}
                                profitsEarned={0} // Placeholder - not in DB
                            />
                        </section>

                        {/* Section 6: Weekly Progress */}
                        <section className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Rocket className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                        Weekly Progress Logs
                                    </h2>
                                </div>
                                {isFounder && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 text-xs"
                                        onClick={() => setIsLogSheetOpen(true)}
                                    >
                                        <Pencil className="w-3 h-3" /> Add Log
                                    </Button>
                                )}
                            </div>

                            {weeklyLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No progress logs recorded yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {weeklyLogs.slice(0, 3).map((log) => (
                                        <div key={log.id} className="border-l-2 border-border/60 pl-4 py-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-foreground/80 line-clamp-2">{log.content}</p>
                                            {log.media_url && (
                                                <div
                                                    className="mt-2 w-16 h-10 rounded overflow-hidden border border-border/60 shrink-0"
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setIsLogSheetOpen(true)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setIsLogSheetOpen(true)}
                                                >
                                                    <img
                                                        src={log.media_url}
                                                        alt="Progress Evidence"
                                                        className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-xs text-primary font-semibold"
                                        onClick={() => setIsLogSheetOpen(true)}
                                    >
                                        {isFounder ? "Manage all logs" : "View all logs"} ({weeklyLogs.length})
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Section 7: Founder Profile */}
                        <section>
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                                Founder Profile
                            </h2>
                            {idea.founder ? (
                                <FounderProfile founder={idea.founder} />
                            ) : (
                                <p className="text-muted-foreground italic">Founder information not available.</p>
                            )}
                        </section>

                        {/* Section 8: External Links */}
                        {/* Section 8: External Links */}
                        <section className="border border-slate-800 rounded-2xl p-6 bg-black text-white shadow-lg overflow-hidden relative">
                            {/* Subtle gradient effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-800/20 to-transparent rounded-bl-3xl pointer-events-none" />

                            <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-5 flex items-center gap-2 relative z-10">
                                <LinkIcon className="w-4 h-4 text-slate-400" />
                                External Links
                            </h2>

                            <div className="space-y-3 relative z-10">
                                {idea.media_url && (
                                    <a
                                        href={idea.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors">
                                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Pitch Deck</p>
                                            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">View Presentation</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </a>
                                )}

                                {idea.website_url && (
                                    <a
                                        href={idea.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors">
                                            <Globe className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Website</p>
                                            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors truncate max-w-[200px]">{idea.website_url}</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </a>
                                )}

                                {idea.founder?.linkedin_profile && (
                                    <a
                                        href={idea.founder.linkedin_profile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group mt-2"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <Linkedin className="w-6 h-6 text-[#0077b5]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900">
                                                Connect on LinkedIn
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{idea.founder.name}</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                    </a>
                                )}

                                {!idea.media_url && !idea.website_url && !idea.founder?.linkedin_profile && (
                                    <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl">
                                        <p className="text-slate-500 italic text-sm">
                                            No external links provided.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* CTA: Reach Out - ONLY for Investors */}
                        {!isFounder && (
                            <section className="border-t border-border pt-8">
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-foreground">
                                            Ready to invest?
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Connect with the founder to discuss terms.
                                        </p>

                                        {/* Animated DJ-style equalizer (decorative) */}
                                        <div className="mt-5">
                                            <Equalizer bars={9} className="w-40 sm:w-56" />
                                        </div>
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={() => navigate("/investor-dashboard")}
                                        className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal font-bold shadow-md transition-all hover:scale-105"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Product Launch Section */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Developed Products</h2>
                            <p className="text-slate-500">Live products and MVPs launched under this venture.</p>
                        </div>

                        <IdeaProductSection
                            ideaId={id!}
                            isFounder={isFounder}
                            founderId={idea.founder_id}
                        />
                    </div>
                )}
            </main>

            <WeeklyLogSheet
                idea={idea}
                open={isLogSheetOpen}
                onOpenChange={setIsLogSheetOpen}
                isFounder={isFounder}
            />
        </div>
    );
}

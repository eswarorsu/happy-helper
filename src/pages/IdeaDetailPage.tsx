import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import {
    IdeaWithFounder,
    FounderProfile as FounderProfileType,
    getStageFromStatus,
    isTrendingDomain,
    formatCurrency,
} from "@/types/investor";
import FinancialSummary from "@/components/investor/FinancialSummary";
import FounderProfile from "@/components/investor/FounderProfile";

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

    useEffect(() => {
        if (!id) return;

        const fetchIdea = async () => {
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

            // Fetch total invested from investment_records
            const { data: investments } = await supabase
                .from("investment_records")
                .select("amount")
                .eq("idea_id", id)
                .eq("status", "confirmed");

            if (investments) {
                const total = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
                setTotalInvested(total);
            }

            setLoading(false);
        };

        fetchIdea();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!idea) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500">Idea not found</p>
            </div>
        );
    }

    const stage = getStageFromStatus(idea.status);
    const isTrending = isTrendingDomain(idea.domain);

    // Parse description for problem/solution (simple split by paragraph)
    const descriptionParts = idea.description.split("\n\n");
    const problemStatement = descriptionParts[0] || idea.description;
    const solutionExplanation =
        descriptionParts.slice(1).join("\n\n") || "See pitch deck for detailed solution.";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/investor-dashboard")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-2">
                        {isTrending && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending Domain
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className={`${stage.variant === "running"
                                    ? "text-green-700 border-green-300"
                                    : stage.variant === "early"
                                        ? "text-blue-700 border-blue-300"
                                        : "text-slate-600 border-slate-300"
                                }`}
                        >
                            {stage.label}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content - Scrollable */}
            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Section 1: Title & Domain */}
                <section>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                        {idea.domain}
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{idea.title}</h1>
                    <p className="text-sm text-slate-600">
                        Founded by{" "}
                        <span className="font-medium">{idea.founder?.name || "Unknown"}</span>
                    </p>
                </section>

                {/* Section 2: Problem Statement */}
                <section className="border border-slate-200 rounded-lg p-5 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Problem Statement
                        </h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{problemStatement}</p>
                </section>

                {/* Section 3: Solution / Idea Explanation */}
                <section className="border border-slate-200 rounded-lg p-5 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Solution / Idea
                        </h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {solutionExplanation}
                    </p>
                </section>

                {/* Section 4: Market & Domain Relevance */}
                <section className="border border-slate-200 rounded-lg p-5 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Market & Domain Relevance
                        </h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Domain</span>
                            <span className="font-medium text-slate-800">{idea.domain}</span>
                        </div>
                        {idea.market_size && (
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Market Size</span>
                                <span className="font-medium text-slate-800">{idea.market_size}</span>
                            </div>
                        )}
                        {idea.traction && (
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Current Traction</span>
                                <span className="font-medium text-slate-800">{idea.traction}</span>
                            </div>
                        )}
                        {idea.team_size && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Team Size</span>
                                <span className="font-medium text-slate-800 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {idea.team_size}
                                </span>
                            </div>
                        )}
                        {!idea.market_size && !idea.traction && !idea.team_size && (
                            <p className="text-slate-400 italic">
                                Detailed market data available in pitch deck.
                            </p>
                        )}
                    </div>
                </section>

                {/* Section 5: Business Model */}
                <section className="border border-slate-200 rounded-lg p-5 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                            Business Model
                        </h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                        Business model details are available in the pitch deck. Key metrics and
                        revenue projections can be discussed after connecting with the founder.
                    </p>
                    {idea.media_url && (
                        <a
                            href={idea.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
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

                {/* Section 7: Founder Profile */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                        Founder Profile
                    </h2>
                    {idea.founder ? (
                        <FounderProfile founder={idea.founder} />
                    ) : (
                        <p className="text-slate-400 italic">Founder information not available.</p>
                    )}
                </section>

                {/* Section 8: External Links */}
                <section className="border border-slate-200 rounded-lg p-5 bg-white">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                        External Links
                    </h2>
                    <div className="space-y-3">
                        {idea.media_url && (
                            <a
                                href={idea.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <FileText className="w-5 h-5 text-slate-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Pitch Deck</p>
                                    <p className="text-xs text-slate-500">Google Drive</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                        )}
                        {idea.website_url && (
                            <a
                                href={idea.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <Globe className="w-5 h-5 text-slate-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Website</p>
                                    <p className="text-xs text-slate-500">{idea.website_url}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                        )}
                        {idea.founder?.linkedin_profile && (
                            <a
                                href={idea.founder.linkedin_profile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <Linkedin className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        Founder LinkedIn
                                    </p>
                                    <p className="text-xs text-slate-500">{idea.founder.name}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                        )}
                        {!idea.media_url && !idea.website_url && !idea.founder?.linkedin_profile && (
                            <p className="text-slate-400 italic text-sm">
                                No external links available. Connect with the founder for more
                                information.
                            </p>
                        )}
                    </div>
                </section>

                {/* CTA: Reach Out */}
                <section className="border-t border-slate-200 pt-8">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-slate-900">
                                Ready to invest?
                            </p>
                            <p className="text-sm text-slate-500">
                                Connect with the founder to discuss terms.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => navigate("/investor-dashboard")}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InvestorSidebar } from "@/components/layout/InvestorSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Loader2, DollarSign, ArrowRight, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface Deal {
    id: string;
    status: string;
    deal_status: string;
    proposed_amount: number | null;
    founder: {
        name: string;
        avatar_url: string | null;
    } | null;
    idea: {
        title: string;
        description: string;
        domain: string;
    } | null;
}

const DealCenterIndex = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userName, setUserName] = useState("Investor");

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate("/auth");
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, user_type, name")
                    .eq("user_id", user.id)
                    .single();

                if (profileError || !profile) {
                    console.error("Profile fetch error:", profileError);
                    // navigate("/auth"); // Don't redirect immediately on error, might be transient
                    return;
                }

                if (profile?.user_type !== "investor") {
                    navigate("/founder-dashboard");
                    return;
                }
                if (profile?.name) setUserName(profile.name);

                const { data, error } = await supabase
                    .from("chat_requests")
                    .select(`
            id,
            status,
            deal_status,
            proposed_amount,
            founder:profiles!chat_requests_founder_id_fkey(name, avatar_url),
            idea:ideas!chat_requests_idea_id_fkey(title, description, domain)
          `)
                    .eq("investor_id", profile.id); // Use PROFILE id, not auth user id

                if (error) throw error;

                // Client-side filtering to be more robust
                const validDeals = (data || []).filter((d: any) =>
                    ["accepted", "deal_pending_investor", "deal_done", "communicating"].includes(d.status) ||
                    d.deal_status === "deal_done"
                );

                setDeals(validDeals);
            } catch (error) {
                console.error("Error fetching deals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeals();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="flex min-h-screen lg:h-screen bg-background text-foreground font-sans">
            <InvestorSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(c => !c)}
                userName={userName}
                onLogout={handleLogout}
                onMessagesClick={() => { }} // Placeholder for now or redirect to dashboard
            />

            {/* Main scrollable content matching InvestorDashboard structure */}
            <div className="flex-1 overflow-y-auto">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md py-3 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">I</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">DEAL CENTER</span>
                    </div>
                    <MobileNav />
                </div>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            Deal Center
                        </h1>
                        <p className="text-muted-foreground mt-2">Manage your active negotiations and investments.</p>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <p className="text-sm text-slate-400">Loading deals...</p>
                        </div>
                    ) : (
                        deals.length === 0 ? (
                            <div className="space-y-4">
                                <Card className="border-dashed border-2 py-12 text-center bg-transparent shadow-none">
                                    <CardContent className="space-y-4">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border">
                                            <Briefcase className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900">No Active Deals Found</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto">
                                            We couldn't find any deals for your account.
                                        </p>
                                        <Button onClick={() => navigate("/marketplace")} className="bg-indigo-600 hover:bg-indigo-700 text-white">Explore Marketplace</Button>
                                    </CardContent>
                                </Card>

                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {deals.map((deal, index) => (
                                    <motion.div
                                        key={deal.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="h-full bg-white hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md group border-border/60">
                                            <CardContent className="p-6 space-y-6">
                                                {/* Founder & Venture Info */}
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                                            <AvatarImage src={deal.founder?.avatar_url || ""} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-600">{deal.founder?.name?.charAt(0) || "F"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900 line-clamp-1">{deal.founder?.name}</h3>
                                                            <p className="text-xs text-slate-500">{deal.idea?.domain}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={deal.deal_status === "deal_done" ? "default" : "secondary"} className={`capitalize ${deal.deal_status === "deal_done" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}>
                                                        {deal.deal_status === "deal_done" ? "Invested" : "Negotiating"}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-lg text-slate-900 line-clamp-1">{deal.idea?.title}</h4>
                                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                                        {deal.idea?.description}
                                                    </p>
                                                </div>

                                                {/* Financials highlight if any */}
                                                {deal.proposed_amount && (
                                                    <div className="bg-background rounded-lg p-3 flex items-center gap-2 border border-slate-100">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {deal.deal_status === "deal_done" ? "Invested: " : "Proposed: "}
                                                            <span className="text-slate-900 font-bold">₹{deal.proposed_amount.toLocaleString()}</span>
                                                        </span>
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    onClick={() => navigate(`/deal-center/${deal.id}`)}
                                                >
                                                    Enter Deal Room <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )
                    )}
                </main>
            </div>
        </div>
    );
};

export default DealCenterIndex;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, MessageSquare, Receipt, TrendingUp, DollarSign,
    PiggyBank, Calendar, Building2, User, Plus, Send, Loader2,
    Percent, ArrowUpRight, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface DealData {
    chatRequest: any;
    idea: any;
    investor: any;
    founder: any;
    investments: any[];
    profitShares: any[];
    isFounder: boolean;
}

const DealCenter = () => {
    const { chatRequestId } = useParams<{ chatRequestId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DealData | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Profit sharing form state
    const [profitAmount, setProfitAmount] = useState("");
    const [profitDescription, setProfitDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (chatRequestId) {
            fetchDealData();
        }
    }, [chatRequestId]);

    const fetchDealData = async () => {
        try {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            // Get current user's profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("id, user_type")
                .eq("user_id", session.user.id)
                .single();

            if (!profile) {
                toast({ title: "Error", description: "Profile not found", variant: "destructive" });
                return;
            }

            // Fetch chat request with related data
            const { data: chatRequest, error: crError } = await supabase
                .from("chat_requests")
                .select(`
                    *,
                    idea:ideas(*),
                    investor:profiles!chat_requests_investor_id_fkey(id, name, avatar_url, email),
                    founder:profiles!chat_requests_founder_id_fkey(id, name, avatar_url, email)
                `)
                .eq("id", chatRequestId)
                .single();

            if (crError || !chatRequest) {
                toast({ title: "Error", description: "Deal not found", variant: "destructive" });
                navigate(-1);
                return;
            }

            // Verify user is part of this deal
            if (profile.id !== chatRequest.founder_id && profile.id !== chatRequest.investor_id) {
                toast({ title: "Access Denied", description: "You are not part of this deal", variant: "destructive" });
                navigate(-1);
                return;
            }

            const isFounder = profile.id === chatRequest.founder_id;

            // Fetch investment records for this chat request
            const { data: investments } = await supabase
                .from("investment_records")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            // Fetch profit shares for this chat request
            const { data: profitShares } = await supabase
                .from("profit_shares")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            setData({
                chatRequest,
                idea: chatRequest.idea,
                investor: chatRequest.investor,
                founder: chatRequest.founder,
                investments: investments || [],
                profitShares: profitShares || [],
                isFounder
            });

        } catch (error) {
            console.error("Error fetching deal data:", error);
            toast({ title: "Error", description: "Failed to load deal data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleRecordProfit = async () => {
        if (!data || !profitAmount || parseFloat(profitAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid profit amount", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("profit_shares")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data.founder.id,
                    investor_id: data.investor.id,
                    idea_id: data.idea.id,
                    amount: parseFloat(profitAmount),
                    description: profitDescription || `Profit share on ${new Date().toLocaleDateString()}`
                });

            if (error) throw error;

            toast({ title: "Success! 🎉", description: `₹${parseFloat(profitAmount).toLocaleString()} profit shared with investor` });
            setProfitAmount("");
            setProfitDescription("");
            fetchDealData(); // Refresh data
        } catch (error) {
            console.error("Error recording profit:", error);
            toast({ title: "Error", description: "Failed to record profit share", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate totals
    const totalInvestment = data?.investments.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    const totalProfit = data?.profitShares.reduce((sum, ps) => sum + (ps.amount || 0), 0) || 0;
    const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : "0.0";

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                    <p className="text-slate-500">Loading deal...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500">Deal not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />

            <div className="relative z-10 p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-slate-600 hover:text-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/transactions")}
                            className="text-slate-600"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Transactions
                        </Button>
                    </div>
                </div>

                {/* Deal Header Card */}
                <Card className="mb-6 border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">
                                    {data.idea.title}
                                </CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {data.idea.domain}
                                    </Badge>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-500">
                                        {data.isFounder ? (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                Investor: {data.investor.name}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                Founder: {data.founder.name}
                                            </span>
                                        )}
                                    </span>
                                </CardDescription>
                            </div>
                            <Badge
                                variant={data.chatRequest.status === "deal_done" ? "default" : "secondary"}
                                className={data.chatRequest.status === "deal_done" ? "bg-emerald-500" : ""}
                            >
                                {data.chatRequest.status === "deal_done" ? "Active Deal" : data.chatRequest.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Investment</p>
                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(totalInvestment)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <PiggyBank className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Profit Shared</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalProfit)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">ROI</p>
                                    <p className="text-xl font-bold text-purple-600">{roi}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-white">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="profit-history" className="rounded-md data-[state=active]:bg-white">
                            <History className="w-4 h-4 mr-2" />
                            Profit History
                        </TabsTrigger>
                        {data.isFounder && (
                            <TabsTrigger value="record-profit" className="rounded-md data-[state=active]:bg-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Record Profit
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <Card className="border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Investment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.investments.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No investments recorded yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.investments.map((inv) => (
                                            <motion.div
                                                key={inv.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <ArrowUpRight className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">Investment</p>
                                                        <p className="text-xs text-slate-500">{formatDate(inv.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
                                                    <Badge variant="secondary" className="text-xs">{inv.status}</Badge>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Profit History Tab */}
                    <TabsContent value="profit-history">
                        <Card className="border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Profit Distribution History</CardTitle>
                                <CardDescription>
                                    All profit shares from founder to investor
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.profitShares.length === 0 ? (
                                    <div className="text-center py-8">
                                        <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">No profits shared yet</p>
                                        {data.isFounder && (
                                            <Button
                                                variant="link"
                                                onClick={() => setActiveTab("record-profit")}
                                                className="mt-2"
                                            >
                                                Record your first profit share →
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.profitShares.map((ps, index) => (
                                            <motion.div
                                                key={ps.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-lg border border-emerald-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <PiggyBank className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {ps.description || "Profit Share"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(ps.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600">+{formatCurrency(ps.amount)}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Record Profit Tab (Founder only) */}
                    {data.isFounder && (
                        <TabsContent value="record-profit">
                            <Card className="border-slate-200 shadow-sm bg-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Share Profit with Investor</CardTitle>
                                    <CardDescription>
                                        Record a profit distribution to {data.investor.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-sm font-medium">
                                            Profit Amount (₹)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="Enter amount"
                                                value={profitAmount}
                                                onChange={(e) => setProfitAmount(e.target.value)}
                                                className="pl-10 h-12 text-lg"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium">
                                            Description (Optional)
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="e.g., Q1 2026 Revenue Share, Monthly Dividend..."
                                            value={profitDescription}
                                            onChange={(e) => setProfitDescription(e.target.value)}
                                            className="resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    {profitAmount && parseFloat(profitAmount) > 0 && (
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Sharing with {data.investor.name}</span>
                                                <span className="font-bold text-emerald-600 text-lg">
                                                    {formatCurrency(parseFloat(profitAmount))}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                                                <span>New ROI after this</span>
                                                <span className="font-medium">
                                                    {totalInvestment > 0
                                                        ? (((totalProfit + parseFloat(profitAmount)) / totalInvestment) * 100).toFixed(1)
                                                        : "0.0"
                                                    }%
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleRecordProfit}
                                        disabled={isSubmitting || !profitAmount || parseFloat(profitAmount) <= 0}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Record Profit Share
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default DealCenter;

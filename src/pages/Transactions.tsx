import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft, Receipt, TrendingUp, Calendar, Search, Filter,
    CheckCircle2, Clock, XCircle, DollarSign, Building2, User, Handshake, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedGridBackground from "@/components/AnimatedGridBackground";
import { MobileNav } from "@/components/layout/MobileNav";
import { InvestorSidebar } from "@/components/layout/InvestorSidebar";
import { CopilotAgentButton } from "@/components/CopilotAgentButton";


interface Transaction {
    id: string;
    idea_id: string;
    investor_id: string;
    founder_id: string;
    chat_request_id: string | null;
    amount: number;
    status: string;
    notes: string | null;
    payment_method: string | null;
    transaction_date: string;
    created_at: string;
    idea?: { title: string; domain: string };
    investor?: { name: string; avatar_url: string | null };
    founder?: { name: string; avatar_url: string | null };
    type: "investment" | "profit_share";
    payment_proof_url?: string;
}

interface Profile {
    id: string;
    name: string;
    user_type: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

const Transactions = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                navigate("/auth?mode=login");
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

            if (!profileData) {
                navigate("/");
                return;
            }

            setProfile(profileData);

            // Fetch transactions based on user type
            const filterColumn = profileData.user_type === "founder" ? "founder_id" : "investor_id";

            // Fetch investment records and profit shares in parallel
            const [investmentResult, profitResult] = await Promise.all([
                (supabase as any)
                    .from("investment_records")
                    .select("*")
                    .eq(filterColumn, profileData.id)
                    .order("created_at", { ascending: false }),
                (supabase as any)
                    .from("profit_shares")
                    .select("*")
                    .eq(filterColumn, profileData.id)
                    .order("created_at", { ascending: false })
            ]);

            if (investmentResult.error) {
                console.error("Error fetching transactions:", investmentResult.error);
                setIsLoading(false);
                return;
            }

            const allInvestments = investmentResult.data || [];
            const allProfits = profitResult.data || [];

            // Collect all unique IDs for batch fetching
            const ideaIds = new Set<string>();
            const profileIds = new Set<string>();

            [...allInvestments, ...allProfits].forEach((record: any) => {
                if (record.idea_id) ideaIds.add(record.idea_id);
                if (record.investor_id) profileIds.add(record.investor_id);
                if (record.founder_id) profileIds.add(record.founder_id);
            });

            // Batch fetch all ideas and profiles in just 2 queries (instead of N*3)
            const [ideasResult, profilesResult] = await Promise.all([
                ideaIds.size > 0
                    ? supabase.from("ideas").select("id, title, domain").in("id", Array.from(ideaIds))
                    : { data: [] },
                profileIds.size > 0
                    ? supabase.from("profiles").select("id, name, avatar_url").in("id", Array.from(profileIds))
                    : { data: [] }
            ]);

            // Build lookup maps
            const ideasMap = new Map<string, { title: string; domain: string }>();
            (ideasResult.data || []).forEach((idea: any) => ideasMap.set(idea.id, idea));

            const profilesMap = new Map<string, { name: string; avatar_url: string | null }>();
            (profilesResult.data || []).forEach((p: any) => profilesMap.set(p.id, p));

            // Enrich all records using the lookup maps (zero additional queries)
            const enrichedTransactions: Transaction[] = [];

            allInvestments.forEach((inv: any) => {
                enrichedTransactions.push({
                    ...inv,
                    payment_method: inv.payment_method || "bank_transfer",
                    transaction_date: inv.transaction_date || inv.created_at,
                    idea: ideasMap.get(inv.idea_id) || undefined,
                    investor: profilesMap.get(inv.investor_id) || undefined,
                    founder: profilesMap.get(inv.founder_id) || undefined,
                    type: "investment"
                });
            });

            allProfits.forEach((profit: any) => {
                enrichedTransactions.push({
                    ...profit,
                    status: "confirmed",
                    payment_method: "bank_transfer",
                    transaction_date: profit.created_at,
                    notes: profit.description,
                    idea: ideasMap.get(profit.idea_id) || undefined,
                    investor: profilesMap.get(profit.investor_id) || undefined,
                    founder: profilesMap.get(profit.founder_id) || undefined,
                    type: "profit_share",
                    chat_request_id: profit.chat_request_id,
                    payment_proof_url: profit.payment_proof_url
                } as any);
            });

            // Sort mixed transactions by date
            enrichedTransactions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setTransactions(enrichedTransactions);
            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    // Filter transactions
    const filteredTransactions = transactions.filter(tx => {
        // Status filter
        if (statusFilter !== "all" && tx.status !== statusFilter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesIdea = tx.idea?.title?.toLowerCase().includes(query);
            const matchesInvestor = tx.investor?.name?.toLowerCase().includes(query);
            const matchesFounder = tx.founder?.name?.toLowerCase().includes(query);
            if (!matchesIdea && !matchesInvestor && !matchesFounder) return false;
        }

        return true;
    });

    // Stats
    const totalAmount = transactions
        .filter(tx => tx.status === "confirmed")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalDeals = transactions.filter(tx => tx.status === "confirmed").length;
    const pendingDeals = transactions.filter(tx => tx.status === "pending").length;

    const formatCompactCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "confirmed":
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>;
            case "pending":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 whitespace-nowrap"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case "cancelled":
                return <Badge className="bg-red-100 text-red-700 border-red-200 whitespace-nowrap"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <motion.div
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                    }}
                    className="mb-4"
                >
                    <div className="w-16 h-16 rounded-2xl bg-brand-yellow flex items-center justify-center overflow-hidden shadow-xl shadow-brand-yellow/20">
                        <img src="/logo.jpeg" alt="Loading" className="w-full h-full object-cover scale-110" />
                    </div>
                </motion.div>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    Loading transactions...
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="flex min-h-screen lg:h-screen bg-slate-50 text-foreground font-sans">
            {profile?.user_type === "investor" && (
                <InvestorSidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(c => !c)}
                    userName={profile?.name}
                    onLogout={handleLogout}
                    onMessagesClick={() => navigate("/mobile-messages")}
                />
            )}

            <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-3 sm:py-4 px-2 sm:px-6">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 w-9 sm:w-auto sm:px-3 -ml-2 sm:ml-0"
                            >
                                <ArrowLeft className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Back</span>
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 shrink-0">
                                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="hidden min-[380px]:block">
                                    <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Transactions</h1>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
                                        {filteredTransactions.length} deals
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end flex-1 min-w-0">
                            <div className="relative w-full max-w-[200px] sm:max-w-none">
                                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 sm:pl-10 w-full sm:w-64 h-9 sm:h-10 text-sm bg-white border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {/* Stats Cards */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-3 gap-2 sm:gap-4"
                    >
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full">
                                <CardContent className="p-3 sm:p-5 flex flex-col items-center text-center h-full justify-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2.5">
                                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                                    </div>
                                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 line-clamp-1">
                                        {profile?.user_type === "investor" ? "Invested" : "Raised"}
                                    </p>
                                    <p className="text-[15px] sm:text-xl font-black text-slate-900 leading-none">
                                        ₹{formatCompactCurrency(totalAmount)}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full">
                                <CardContent className="p-3 sm:p-5 flex flex-col items-center text-center h-full justify-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5">
                                        <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 line-clamp-1">
                                        Completed
                                    </p>
                                    <p className="text-[15px] sm:text-xl font-black text-emerald-600 leading-none">
                                        {totalDeals}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full">
                                <CardContent className="p-3 sm:p-5 flex flex-col items-center text-center h-full justify-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2.5">
                                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                    </div>
                                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 line-clamp-1">
                                        Pending
                                    </p>
                                    <p className="text-[15px] sm:text-xl font-black text-amber-500 leading-none">
                                        {pendingDeals}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>

                    {/* Filter Tabs */}
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
                        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap rounded-xl w-full sm:w-auto">
                            <TabsTrigger value="all" className="text-xs text-slate-500 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">All ({transactions.length})</TabsTrigger>
                            <TabsTrigger value="confirmed" className="text-xs text-slate-500 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Confirmed ({transactions.filter(t => t.status === "confirmed").length})</TabsTrigger>
                            <TabsTrigger value="pending" className="text-xs text-slate-500 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pending ({transactions.filter(t => t.status === "pending").length})</TabsTrigger>
                            <TabsTrigger value="cancelled" className="text-xs text-slate-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">Cancelled ({transactions.filter(t => t.status === "cancelled").length})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Transaction List */}
                    <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-semibold text-slate-900">Transaction History</CardTitle>
                            <CardDescription className="text-xs text-slate-500">All your investment deals</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Receipt className="w-12 h-12 mb-4 text-slate-300" />
                                    <p className="font-medium text-slate-500">No transactions found</p>
                                    <p className="text-sm mt-1">Your completed deals will appear here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    <AnimatePresence>
                                        {filteredTransactions.map((tx, index) => (
                                            <motion.div
                                                key={tx.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="px-4 py-2 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                onClick={() => setSelectedTransaction(tx)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-9 h-9 mt-0.5 rounded-lg flex items-center justify-center shrink-0 ${tx.status === "confirmed" ? "bg-emerald-100" :
                                                        tx.status === "pending" ? "bg-amber-100" : "bg-red-100"
                                                        }`}>
                                                        {tx.status === "confirmed" ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        ) : tx.status === "pending" ? (
                                                            <Clock className="w-4 h-4 text-amber-600" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h4 className="text-base font-semibold text-slate-900 truncate group-hover:text-brand-yellow transition-colors max-w-full">
                                                                        {tx.idea?.title || "Unknown Venture"}
                                                                    </h4>
                                                                    {tx.type === "profit_share" ? (
                                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 whitespace-nowrap">
                                                                            <TrendingUp className="w-3 h-3 mr-1" /> Profit Share
                                                                        </Badge>
                                                                    ) : (
                                                                        getStatusBadge(tx.status)
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0 pl-2">
                                                                <p className={`text-lg sm:text-xl font-bold leading-none whitespace-nowrap ${tx.type === "profit_share"
                                                                    ? (profile?.user_type === "investor" ? "text-emerald-600" : "text-red-600")
                                                                    : (profile?.user_type === "investor" ? "text-red-600" : "text-emerald-600")
                                                                    }`}>
                                                                    {tx.type === "profit_share"
                                                                        ? (profile?.user_type === "investor" ? "+" : "-")
                                                                        : (profile?.user_type === "investor" ? "-" : "+")
                                                                    }₹{Number(tx.amount).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                                <Building2 className="w-3 h-3 text-slate-400" />
                                                                {tx.idea?.domain || "N/A"}
                                                            </span>
                                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                                <User className="w-3 h-3 text-slate-400" />
                                                                {profile?.user_type === "investor" ? tx.founder?.name : tx.investor?.name}
                                                            </span>
                                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                {formatDate(tx.created_at)}
                                                            </span>
                                                        </div>

                                                        <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 break-words pr-2">
                                                            {tx.notes || tx.payment_method || "Bank Transfer"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            {selectedTransaction?.type === "profit_share" ? (
                                <>
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    <span>Profit Share Details</span>
                                </>
                            ) : (
                                <>
                                    <Receipt className="w-5 h-5 text-slate-900" />
                                    <span>Transaction Details</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Transaction ID: {selectedTransaction?.id.slice(0, 8)}...
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransaction && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center">
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Amount</p>
                                <p className={`text-2xl md:text-3xl font-bold mt-1 ${selectedTransaction.type === "profit_share"
                                    ? (profile?.user_type === "investor" ? "text-emerald-600" : "text-red-600")
                                    : (profile?.user_type === "investor" ? "text-red-600" : "text-emerald-600")
                                    }`}>
                                    ₹{Number(selectedTransaction.amount).toLocaleString()}
                                </p>
                                <Badge className="mt-2" variant="outline">
                                    {selectedTransaction.status.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium text-slate-900">
                                        {new Date(selectedTransaction.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Venture</span>
                                    <span className="font-medium text-slate-900">{selectedTransaction.idea?.title}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">
                                        {profile?.user_type === "investor" ? "From Founder" : "To Investor"}
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        {profile?.user_type === "investor" ? selectedTransaction.founder?.name : selectedTransaction.investor?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Purpose/Description</span>
                                    <span className="font-medium text-slate-900 text-right max-w-full sm:max-w-[200px] break-words">
                                        {selectedTransaction.notes || "N/A"}
                                    </span>
                                </div>
                            </div>

                            {selectedTransaction.payment_proof_url && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Receipt className="w-4 h-4" /> Payment Proof
                                    </p>
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-50">
                                        <img
                                            src={selectedTransaction.payment_proof_url}
                                            alt="Payment Proof"
                                            className="w-full h-full object-contain"
                                        />
                                        <a
                                            href={selectedTransaction.payment_proof_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4 text-slate-900" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => setSelectedTransaction(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <MobileNav userType={profile?.user_type as any} />
            <CopilotAgentButton context="transactions" />
        </div >
    );
};

export default Transactions;

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
    CheckCircle2, Clock, XCircle, DollarSign, Building2, User, Handshake
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedGridBackground from "@/components/AnimatedGridBackground";

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

            const { data: investmentData, error: investmentError } = await supabase
                .from("investment_records")
                .select("*")
                .eq(filterColumn, profileData.id)
                .order("created_at", { ascending: false });

            if (investmentError) {
                console.error("Error fetching transactions:", investmentError);
                setIsLoading(false);
                return;
            }

            // Enrich with idea and profile data
            const enrichedTransactions: Transaction[] = [];

            for (const inv of (investmentData || [])) {
                // Fetch idea info
                const { data: ideaData } = await supabase
                    .from("ideas")
                    .select("title, domain")
                    .eq("id", inv.idea_id)
                    .single();

                // Fetch investor/founder info
                const { data: investorData } = await supabase
                    .from("profiles")
                    .select("name, avatar_url")
                    .eq("id", inv.investor_id)
                    .single();

                const { data: founderData } = await supabase
                    .from("profiles")
                    .select("name, avatar_url")
                    .eq("id", inv.founder_id)
                    .single();

                enrichedTransactions.push({
                    ...inv,
                    payment_method: inv.payment_method || "bank_transfer",
                    transaction_date: inv.transaction_date || inv.created_at,
                    idea: ideaData || undefined,
                    investor: investorData || undefined,
                    founder: founderData || undefined
                });
            }

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "confirmed":
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>;
            case "pending":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case "cancelled":
                return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
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
            <AnimatedGridBackground className="bg-slate-50">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AnimatedGridBackground>
        );
    }

    return (
        <AnimatedGridBackground className="bg-slate-50">
            <div className="min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="text-slate-500"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900">Transactions</h1>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        {filteredTransactions.length} deals
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-64 h-10 bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
                    {/* Stats Cards */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <motion.div variants={itemVariants}>
                            <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-0">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Total {profile?.user_type === "investor" ? "Invested" : "Raised"}</p>
                                            <p className="text-2xl font-bold mt-1">₹{totalAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Deals</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{totalDeals}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                            <Handshake className="w-6 h-6 text-emerald-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Deals</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingDeals}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-amber-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>

                    {/* Filter Tabs */}
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
                        <TabsList className="bg-white border border-slate-200 p-1 h-auto">
                            <TabsTrigger value="all" className="text-xs">All ({transactions.length})</TabsTrigger>
                            <TabsTrigger value="confirmed" className="text-xs">Confirmed ({transactions.filter(t => t.status === "confirmed").length})</TabsTrigger>
                            <TabsTrigger value="pending" className="text-xs">Pending ({transactions.filter(t => t.status === "pending").length})</TabsTrigger>
                            <TabsTrigger value="cancelled" className="text-xs">Cancelled ({transactions.filter(t => t.status === "cancelled").length})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Transaction List */}
                    <Card className="bg-white border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
                            <CardDescription className="text-xs">All your investment deals</CardDescription>
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
                                                className="p-4 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tx.status === "confirmed" ? "bg-emerald-100" :
                                                        tx.status === "pending" ? "bg-amber-100" : "bg-red-100"
                                                        }`}>
                                                        {tx.status === "confirmed" ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                        ) : tx.status === "pending" ? (
                                                            <Clock className="w-5 h-5 text-amber-600" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                                {tx.idea?.title || "Unknown Venture"}
                                                            </h4>
                                                            {getStatusBadge(tx.status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="w-3 h-3" />
                                                                {tx.idea?.domain || "N/A"}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {profile?.user_type === "investor" ? tx.founder?.name : tx.investor?.name}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(tx.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="text-right shrink-0">
                                                        <p className={`text-lg font-bold ${profile?.user_type === "investor" ? "text-red-600" : "text-emerald-600"
                                                            }`}>
                                                            {profile?.user_type === "investor" ? "-" : "+"}₹{Number(tx.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                            {tx.payment_method || "Bank Transfer"}
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
        </AnimatedGridBackground>
    );
};

export default Transactions;

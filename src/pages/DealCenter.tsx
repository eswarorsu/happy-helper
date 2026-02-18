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
    Percent, ArrowUpRight, History, CheckCircle2, Upload, Image as ImageIcon, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import PaymentQR from "@/components/PaymentQR";

interface DealData {
    chatRequest: any;
    idea: any;
    investor: any;
    founder: any;
    investments: any[];
    profitShares: any[];
    transactions: any[];
    isFounder: boolean;
}

const DealCenter = () => {
    const { chatRequestId } = useParams<{ chatRequestId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DealData | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Profit sharing form state
    const [profitAmount, setProfitAmount] = useState("");
    const [profitDescription, setProfitDescription] = useState("");


    // Payment State (Investor -> Founder)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState("");
    const [paymentStep, setPaymentStep] = useState<"input" | "qr" | "upload" | "confirm">("input");
    const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [uploadingProof, setUploadingProof] = useState(false);

    // Profit Payment State (Founder -> Investor)
    const [showProfitPaymentModal, setShowProfitPaymentModal] = useState(false);
    const [profitPaymentStep, setProfitPaymentStep] = useState<"input" | "qr" | "upload">("input");
    const [profitProofFile, setProfitProofFile] = useState<File | null>(null);
    const [uploadingProfitProof, setUploadingProfitProof] = useState(false);
    const [profitTransactions, setProfitTransactions] = useState<any[]>([]);
    const [selectedProfitShare, setSelectedProfitShare] = useState<any | null>(null);

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
                    investor:profiles!chat_requests_investor_id_fkey(id, name, avatar_url, email, upi_id),
                    founder:profiles!chat_requests_founder_id_fkey(id, name, avatar_url, email, upi_id)
                `)
                .eq("id", chatRequestId)
                .single(); // ... (rest of the file) // ...



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
            const { data: investments } = await (supabase as any)
                .from("investment_records")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            // Fetch profit shares for this chat request
            const { data: profitShares } = await (supabase as any)
                .from("profit_shares")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            // Fetch UPI transactions
            const { data: transactions } = await (supabase as any)
                .from("upi_transactions")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            // Fetch Profit transactions (pending investor confirmation)
            const { data: profitTx } = await (supabase as any)
                .from("profit_transactions")
                .select("*")
                .eq("chat_request_id", chatRequestId)
                .order("created_at", { ascending: false });

            setProfitTransactions(profitTx || []);

            setData({
                chatRequest,
                idea: chatRequest.idea,
                investor: chatRequest.investor,
                founder: chatRequest.founder,
                investments: investments || [],
                profitShares: profitShares || [],
                transactions: transactions || [],
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
            const { error } = await (supabase as any)
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

            // Send chat notification
            await sendProfitNotification(parseFloat(profitAmount), profitDescription || `Profit share on ${new Date().toLocaleDateString()}`);

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

    // Handle profit payment initiation (shows QR code)
    const handleInitiateProfitPayment = () => {
        if (!profitAmount || parseFloat(profitAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid profit amount", variant: "destructive" });
            return;
        }
        if (!data?.investor.upi_id) {
            toast({ title: "UPI Not Set", description: "Investor has not set up their UPI ID yet. Please ask them to update their profile.", variant: "destructive" });
            return;
        }
        setProfitPaymentStep("qr");
    };

    // Handle profit payment completion with proof
    const handleProfitPaymentComplete = async (proofUrl: string) => {
        setIsSubmitting(true);
        try {
            // Create profit transaction record
            const { data: transaction, error } = await (supabase as any)
                .from("profit_transactions")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data!.founder.id,
                    investor_id: data!.investor.id,
                    idea_id: data!.idea.id,
                    amount: parseFloat(profitAmount),
                    investor_upi_id: data!.investor.upi_id,
                    status: 'founder_confirmed',
                    description: profitDescription || `Profit share on ${new Date().toLocaleDateString()}`,
                    payment_proof_url: proofUrl,
                    founder_confirmed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Send notification + screenshot in chat
            const { sendMessage, connectFirebase } = await import("@/lib/firebase");
            await connectFirebase();

            // Send text notification
            await sendMessage(chatRequestId!, {
                sender_id: data!.founder.id,
                content: `💰 Profit Payment Sent: ₹${parseFloat(profitAmount).toLocaleString()} via UPI.\n\n📋 ${profitDescription || 'Profit share'}\n\n✅ Please confirm receipt in your Deal Center.`,
                type: 'text'
            });

            // Send screenshot as image message
            await sendMessage(chatRequestId!, {
                sender_id: data!.founder.id,
                content: proofUrl,
                type: 'image'
            });

            // Insert system notification for bell icon
            const { error: notifError } = await (supabase as any)
                .from("notifications")
                .insert({
                    user_id: data!.investor.id,
                    title: "💰 Profit Payment Sent",
                    message: `${data!.founder.name} has sent a profit share of ₹${parseFloat(profitAmount).toLocaleString()}. Please verify in Deal Center.`,
                    redirect_url: `/deal-center/${chatRequestId}`,
                    is_read: false
                });

            if (notifError) {
                console.error("NOTIFICATION INSERT FAILED:", notifError);
                toast({ title: "Notification Error", description: "Payment recorded, but failed to notify investor: " + notifError.message, variant: "destructive" });
            } else {
                console.log("Notification inserted successfully");
            }

            toast({ title: "Payment Submitted", description: "Investor has been notified to verify and confirm." });
            setShowProfitPaymentModal(false);
            setProfitPaymentStep("input");
            setProfitAmount("");
            setProfitDescription("");
            setProfitProofFile(null);
            fetchDealData();

        } catch (error) {
            console.error("Profit payment error:", error);
            toast({ title: "Error", description: "Failed to record profit payment", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Investor confirms profit receipt
    // Investor confirms profit receipt
    const handleConfirmProfitReceipt = async (transactionId: string, amount: number, description: string) => {
        if (!data) return;

        try {
            setLoading(true);

            // Find the transaction to get proof URL
            const transaction = profitTransactions.find(t => t.id === transactionId);
            const proofUrl = transaction?.payment_proof_url;

            // 1. Update profit transaction status
            const { error: txError } = await (supabase as any)
                .from("profit_transactions")
                .update({
                    status: 'completed',
                    investor_confirmed_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (txError) throw txError;

            // 2. Create official profit share record
            const { error: psError } = await (supabase as any)
                .from("profit_shares")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data.founder.id,
                    investor_id: data.investor.id,
                    idea_id: data.idea.id,
                    amount: amount,
                    description: description || `Confirmed profit share`,
                    payment_proof_url: proofUrl,
                });

            if (psError) throw psError;

            // 3. Notify founder
            const { sendMessage, connectFirebase } = await import("@/lib/firebase");
            await connectFirebase();
            await sendMessage(chatRequestId!, {
                sender_id: data.investor.id,
                content: `✅ Profit Received: ₹${amount.toLocaleString()} confirmed by investor.`,
                type: 'text'
            });

            toast({ title: "Receipt Confirmed", description: `₹${amount.toLocaleString()} profit share has been recorded.` });
            fetchDealData();

        } catch (error) {
            console.error("Error confirming profit:", error);
            toast({ title: "Error", description: "Failed to confirm profit receipt", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Helper to send system message
    const sendProfitNotification = async (amount: number, description: string) => {
        try {
            // Dynamically import to avoid circular dependencies if any, or just use the imported function
            const { sendMessage, connectFirebase } = await import("@/lib/firebase");
            await connectFirebase();

            await sendMessage(chatRequestId!, {
                sender_id: data!.founder.id, // Sent by founder
                content: `💰 Profit Shared: ₹${amount.toLocaleString()} - ${description}`,
                type: 'text'
            });

            // Insert into notifications table
            const { error: notifError } = await (supabase as any)
                .from("notifications")
                .insert({
                    user_id: data!.investor.id,
                    title: "💰 Profit Received",
                    message: `You received a profit share of ₹${amount.toLocaleString()} from ${data!.founder.name}`,
                    redirect_url: `/deal-center/${chatRequestId}`,
                    is_read: false
                });

            if (notifError) {
                console.error("NOTIFICATION INSERT FAILED (Manual):", notifError);
                toast({
                    title: "Notification Error",
                    description: "Profit recorded, but failed to notify investor (Bell): " + notifError.message,
                    variant: "destructive"
                });
            } else {
                console.log("Notification (Manual) inserted successfully");
            }

        } catch (error) {
            console.error("Failed to send notification:", error);
            toast({ title: "Notification System Error", description: "Failed to process notification.", variant: "destructive" });
        }
    };

    // --- PAYMENT LOGIC ---
    const handleInitiatePayment = async () => {
        if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Enter a valid investment amount", variant: "destructive" });
            return;
        }

        if (!data?.founder.upi_id) {
            toast({
                title: "Founder UPI Missing",
                description: "This founder hasn't set up their UPI ID yet. Please ask them to update their profile.",
                variant: "destructive"
            });
            return;
        }

        setPaymentStep("qr");
    };

    const handlePaymentComplete = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create UPI Transaction Record
            const { data: transaction, error } = await (supabase as any)
                .from("upi_transactions")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data!.founder.id,
                    investor_id: data!.investor.id,
                    idea_id: data!.idea.id,
                    amount: parseFloat(investmentAmount),
                    founder_upi_id: data!.founder.upi_id,
                    status: 'investor_confirmed',
                    investor_confirmed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            setCurrentTransactionId(transaction.id);

            // 2. Notify Founder via Chat
            const { sendMessage, connectFirebase } = await import("@/lib/firebase");
            await connectFirebase();
            await sendMessage(chatRequestId!, {
                sender_id: data!.investor.id,
                content: `💸 Payment Initiated: ₹${parseFloat(investmentAmount).toLocaleString()} via UPI. Please confirm receipt in your dashboard.`,
                type: 'text'
            });

            toast({ title: "Payment Recorded", description: "Founder has been notified to confirm receipt." });
            setShowPaymentModal(false);
            setPaymentStep("input");
            setInvestmentAmount("");
            setPaymentProofFile(null);
            fetchDealData();

        } catch (error) {
            console.error("Payment error:", error);
            toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    const handlePaymentCompleteWithProof = async (proofUrl: string) => {
        setIsSubmitting(true);
        try {
            // 1. Create UPI Transaction Record with proof
            const { data: transaction, error } = await (supabase as any)
                .from("upi_transactions")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data!.founder.id,
                    investor_id: data!.investor.id,
                    idea_id: data!.idea.id,
                    amount: parseFloat(investmentAmount),
                    founder_upi_id: data!.founder.upi_id,
                    status: 'investor_confirmed',
                    investor_confirmed_at: new Date().toISOString(),
                    payment_proof_url: proofUrl
                })
                .select()
                .single();

            if (error) throw error;
            setCurrentTransactionId(transaction.id);

            // 2. Notify Founder via Chat with screenshot
            const { sendMessage, connectFirebase } = await import("@/lib/firebase");
            await connectFirebase();

            // Send text notification
            await sendMessage(chatRequestId!, {
                sender_id: data!.investor.id,
                content: `💸 Investment Payment: ₹${parseFloat(investmentAmount).toLocaleString()} via UPI\n\n✅ Please verify and confirm receipt in your Deal Center.`,
                type: 'text'
            });

            // Send screenshot as image message
            await sendMessage(chatRequestId!, {
                sender_id: data!.investor.id,
                content: proofUrl,
                type: 'image'
            });

            toast({ title: "Payment Submitted", description: "Founder has been notified to verify and confirm." });
            setShowPaymentModal(false);
            setPaymentStep("input");
            setInvestmentAmount("");
            setPaymentProofFile(null);
            fetchDealData();

        } catch (error) {
            console.error("Payment error:", error);
            toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmPayment = async (transactionId: string, amount: number) => {
        if (!data) return;

        try {
            setLoading(true);
            // 1. Update transaction status
            const { error: txError } = await (supabase as any)
                .from("upi_transactions")
                .update({
                    status: 'completed',
                    founder_confirmed_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (txError) throw txError;

            // 2. Create official investment record
            const { error: invError } = await (supabase as any)
                .from("investment_records")
                .insert({
                    chat_request_id: chatRequestId,
                    founder_id: data.founder.id,
                    investor_id: data.investor.id,
                    idea_id: data.idea.id,
                    amount: amount,
                    status: 'confirmed',
                    notes: `UPI Transaction Confirmed: ${transactionId}`
                });

            if (invError) throw invError;



            toast({ title: "Payment Confirmed", description: "Investment recorded successfully!" });

            // Send notification to investor
            try {
                const { sendMessage, connectFirebase } = await import("@/lib/firebase");
                await connectFirebase();
                await sendMessage(chatRequestId!, {
                    sender_id: data.founder.id,
                    content: `✅ Payment Received: ₹${amount.toLocaleString()} confirmed. Equity recorded.`,
                    type: 'text'
                });
            } catch (e) {
                console.error("Firebase notif failed", e);
            }

            fetchDealData(); // Refresh data

        } catch (error) {
            console.error("Error confirming payment:", error);
            toast({ title: "Error", description: "Failed to confirm payment", variant: "destructive" });
        } finally {
            setLoading(false);
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                    <p className="text-slate-500">Loading deal...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-slate-500">Deal not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-brand-yellow/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-yellow/20 rounded-full blur-[128px] opacity-20" />
                <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-600/30 rounded-full blur-[128px] opacity-20" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
            </div>

            <div className="relative z-10 p-6 max-w-5xl mx-auto pt-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-slate-500 hover:text-foreground hover:bg-brand-yellow/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => fetchDealData()}
                            disabled={loading}
                            className="border-border bg-white text-foreground hover:bg-secondary shadow-sm"
                            title="Refresh data"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/transactions")}
                            className="border-border bg-white text-foreground hover:bg-secondary shadow-sm"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            History
                        </Button>
                    </div>
                </div>

                {/* Deal Header Card */}
                <Card className="mb-8 border-border bg-white/80 backdrop-blur-xl shadow-sm">
                    <CardHeader className="pb-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                    {data.idea.title} <span className="text-slate-500 font-normal text-lg ml-2">Deal Room</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow bg-brand-yellow/10 px-3 py-1">
                                        {data.idea.domain}
                                    </Badge>
                                    <span className="text-slate-600">•</span>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        {data.isFounder ? (
                                            <>
                                                <User className="w-4 h-4" />
                                                <span>Investor: <span className="text-slate-700 font-medium">{data.investor.name}</span></span>
                                            </>
                                        ) : (
                                            <>
                                                <Building2 className="w-4 h-4" />
                                                <span>Founder: <span className="text-slate-700 font-medium">{data.founder.name}</span></span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant={data.chatRequest.status === "deal_done" ? "default" : "secondary"}
                                className={data.chatRequest.status === "deal_done"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 px-4 py-1.5 text-sm"
                                    : "bg-brand-yellow/10 text-foreground border-border"}
                            >
                                {data.chatRequest.status === "deal_done" ? "Active Deal" : data.chatRequest.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-border bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Investment</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalInvestment)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-colors" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                                    <PiggyBank className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Profit Shared</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalProfit)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute inset-0 bg-brand-yellow/5 group-hover:bg-brand-yellow/10 transition-colors" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                                    <TrendingUp className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current ROI</p>
                                    <p className="text-2xl font-bold text-amber-600 mt-1">{roi}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Profit Receipts (Investor View) */}
                {!data.isFounder && profitTransactions.filter(t => t.status === 'founder_confirmed').length > 0 && (
                    <Card className="border-orange-200 bg-orange-50 mb-8 overflow-hidden shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                                <PiggyBank className="w-5 h-5" />
                                Pending Profit Confirmations
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                                Founder has sent profit shares. Please confirm receipt.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profitTransactions.filter(t => t.status === 'founder_confirmed').map((tx) => (
                                <div key={tx.id} className="p-4 bg-white rounded-lg border border-orange-200 flex items-center justify-between shadow-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <PiggyBank className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{formatCurrency(tx.amount)}</p>
                                                <p className="text-xs text-slate-500">{tx.description || 'Profit share'}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Sent {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {tx.payment_proof_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-border hover:bg-background text-muted-foreground"
                                                onClick={() => window.open(tx.payment_proof_url, '_blank')}
                                            >
                                                <ImageIcon className="w-4 h-4 mr-1" />
                                                View Proof
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            disabled={loading}
                                            onClick={() => handleConfirmProfitReceipt(tx.id, tx.amount, tx.description)}
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Confirm Receipt
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-brand-yellow/10 p-1 border border-border rounded-xl w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex md:gap-2">
                        <TabsTrigger
                            value="overview"
                            className="rounded-lg data-[state=active]:bg-brand-charcoal data-[state=active]:text-brand-yellow text-muted-foreground hover:text-foreground transition-all h-10"
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="profit-history"
                            className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all h-10"
                        >
                            <History className="w-4 h-4 mr-2" />
                            Profit History
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all h-10"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Transactions
                            {data.transactions.some(t => t.status === 'investor_confirmed' && data.isFounder) && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </TabsTrigger>
                        {data.isFounder && (
                            <TabsTrigger
                                value="record-profit"
                                className="rounded-lg data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-charcoal text-slate-500 hover:text-foreground transition-all h-10 col-span-2 md:col-span-1"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Record Profit
                            </TabsTrigger>
                        )}
                        {!data.isFounder && (
                            <Button
                                onClick={() => setShowPaymentModal(true)}
                                className="ml-2 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal border-none shadow-lg shadow-brand-yellow/20"
                                size="sm"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Invest Now
                            </Button>
                        )}
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <Card className="border-border bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">Investment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.investments.length === 0 ? (
                                    <p className="text-slate-500 text-center py-12">No investments recorded yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.investments.map((inv) => (
                                            <motion.div
                                                key={inv.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-border/80 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                        <ArrowUpRight className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">Investment</p>
                                                        <p className="text-xs text-slate-500">{formatDate(inv.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-foreground text-lg">{formatCurrency(inv.amount)}</p>
                                                    <Badge variant="secondary" className="text-xs bg-brand-yellow/10 text-foreground border-border uppercase tracking-wider text-[10px]">{inv.status}</Badge>
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
                        <Card className="border-border bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">Profit Distribution History</CardTitle>
                                <CardDescription className="text-slate-500">
                                    All profit shares from founder to investor
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.profitShares.length === 0 ? (
                                    <div className="text-center py-12">
                                        <PiggyBank className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500">No profits shared yet</p>
                                        {data.isFounder && (
                                            <Button
                                                variant="link"
                                                onClick={() => setActiveTab("record-profit")}
                                                className="mt-2 text-brand-yellow hover:text-brand-yellow/80"
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
                                                onClick={() => setSelectedProfitShare(ps)}
                                                className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                        <PiggyBank className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {ps.description || "Profit Share"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(ps.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600 text-lg">+{formatCurrency(ps.amount)}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions">
                        <Card className="border-border bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">Transaction History</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Track all UPI payments and their status
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.transactions.length === 0 ? (
                                    <p className="text-slate-500 text-center py-12">No transactions recorded yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.transactions.map((tx) => (
                                            <motion.div
                                                key={tx.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-border/80 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.status === 'completed'
                                                        ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                                                        : 'bg-blue-100 border-blue-200 text-blue-600'
                                                        }`}>
                                                        {tx.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">Investment Payment</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(tx.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-foreground text-lg">{formatCurrency(tx.amount)}</p>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="secondary" className={`text-[10px] uppercase tracking-wider ${tx.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {tx.status.replace('_', ' ')}
                                                        </Badge>

                                                        {/* Founder Confirm Button */}
                                                        {data.isFounder && tx.status === 'investor_confirmed' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
                                                                onClick={() => handleConfirmPayment(tx.id, tx.amount)}
                                                            >
                                                                Confirm Receipt
                                                            </Button>
                                                        )}
                                                    </div>
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
                            <Card className="border-border bg-white shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg text-foreground">Share Profit with Investor</CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Record a profit distribution to {data.investor.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                                            Profit Amount (₹)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="Enter amount"
                                                value={profitAmount}
                                                onChange={(e) => setProfitAmount(e.target.value)}
                                                className="pl-10 h-12 text-lg bg-white border-border text-foreground focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                                            Description (Optional)
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="e.g., Q1 2026 Revenue Share, Monthly Dividend..."
                                            value={profitDescription}
                                            onChange={(e) => setProfitDescription(e.target.value)}
                                            className="resize-none bg-white border-border text-foreground focus:border-brand-yellow/50 focus:ring-brand-yellow/20"
                                            rows={3}
                                        />
                                    </div>

                                    {profitAmount && parseFloat(profitAmount) > 0 && (
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-500">Sharing with {data.investor.name}</span>
                                                <span className="font-bold text-emerald-600 text-lg">
                                                    {formatCurrency(parseFloat(profitAmount))}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 border-t border-emerald-200 pt-2">
                                                <span>New ROI after this</span>
                                                <span className="font-medium text-emerald-600">
                                                    {totalInvestment > 0
                                                        ? (((totalProfit + parseFloat(profitAmount)) / totalInvestment) * 100).toFixed(1)
                                                        : "0.0"
                                                    }%
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => setShowProfitPaymentModal(true)}
                                        disabled={isSubmitting || !profitAmount || parseFloat(profitAmount) <= 0}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Share Profit via UPI
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>

                {/* --- PAYMENT MODAL (Investor -> Founder) --- */}
                <Dialog open={showPaymentModal} onOpenChange={(open) => {
                    setShowPaymentModal(open);
                    if (!open) {
                        setPaymentStep("input");
                        setPaymentProofFile(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invest via UPI</DialogTitle>
                            <DialogDescription>
                                Direct transfer to {data.founder.name}
                            </DialogDescription>
                        </DialogHeader>

                        {paymentStep === "input" && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Investment Amount (₹)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            placeholder="50000"
                                            value={investmentAmount}
                                            onChange={(e) => setInvestmentAmount(e.target.value)}
                                            className="pl-10 text-lg"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full" onClick={handleInitiatePayment}>
                                    Generate QR Code
                                </Button>
                            </div>
                        )}

                        {paymentStep === "qr" && data.founder.upi_id && (
                            <div className="py-2">
                                <PaymentQR
                                    upiId={data.founder.upi_id}
                                    payeeName={data.founder.name}
                                    amount={parseFloat(investmentAmount)}
                                    note={`Investment for ${data.idea.title}`}
                                    onPaymentComplete={() => setPaymentStep("upload")}
                                />
                                <Button
                                    variant="ghost"
                                    className="w-full mt-2"
                                    onClick={() => setPaymentStep("input")}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {paymentStep === "upload" && (
                            <div className="space-y-4 py-4">
                                <div className="text-center space-y-2">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                                    <h3 className="text-lg font-semibold text-foreground">Payment Made!</h3>
                                    <p className="text-sm text-slate-400">
                                        Upload a screenshot of your payment confirmation for verification.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Payment Screenshot</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-brand-yellow transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {paymentProofFile ? (
                                            <div className="space-y-2">
                                                <ImageIcon className="w-8 h-8 text-brand-yellow mx-auto" />
                                                <p className="text-sm text-brand-yellow font-medium">{paymentProofFile.name}</p>
                                                <p className="text-xs text-slate-500">Click to change</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                                                <p className="text-sm text-slate-400">Click or drag to upload screenshot</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setPaymentStep("qr")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal"
                                        disabled={!paymentProofFile || uploadingProof}
                                        onClick={async () => {
                                            if (!paymentProofFile) return;
                                            setUploadingProof(true);
                                            try {
                                                // Upload to Supabase Storage
                                                const fileExt = paymentProofFile.name.split('.').pop();
                                                const fileName = `investment_${chatRequestId}_${Date.now()}.${fileExt}`;
                                                const { error: uploadError } = await supabase.storage
                                                    .from('payment-proofs')
                                                    .upload(fileName, paymentProofFile);

                                                if (uploadError) throw uploadError;

                                                const { data: urlData } = supabase.storage
                                                    .from('payment-proofs')
                                                    .getPublicUrl(fileName);

                                                await handlePaymentCompleteWithProof(urlData.publicUrl);
                                            } catch (error) {
                                                console.error("Upload error:", error);
                                                toast({ title: "Upload Failed", description: "Failed to upload screenshot. Please try again.", variant: "destructive" });
                                            } finally {
                                                setUploadingProof(false);
                                            }
                                        }}
                                    >
                                        {uploadingProof ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* --- PROFIT PAYMENT MODAL (Founder -> Investor) --- */}
                <Dialog open={showProfitPaymentModal} onOpenChange={(open) => {
                    setShowProfitPaymentModal(open);
                    if (!open) {
                        setProfitPaymentStep("input");
                        setProfitProofFile(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-md border-border bg-gradient-to-b from-white to-slate-50">
                        <DialogHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 border border-emerald-200">
                                <PiggyBank className="w-8 h-8 text-emerald-400" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                Share Profit via UPI
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Send profit share to <span className="text-emerald-600 font-medium">{data.investor.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        {profitPaymentStep === "input" && (
                            <div className="space-y-6 py-4">
                                {/* Amount Display Card */}
                                <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                    <div className="relative">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Amount to Share</p>
                                        <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            {formatCurrency(parseFloat(profitAmount) || 0)}
                                        </p>

                                        {profitDescription && (
                                            <div className="mt-4 pt-4 border-t border-emerald-200">
                                                <p className="text-sm text-slate-600 flex items-start gap-2">
                                                    <Receipt className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                                    {profitDescription}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recipient Info */}
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
                                    <div className="w-12 h-12 rounded-full bg-brand-yellow flex items-center justify-center text-brand-charcoal font-bold text-lg">
                                        {data.investor.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground">{data.investor.name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{data.investor.upi_id || 'UPI ID not set'}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
                                    onClick={handleInitiateProfitPayment}
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Generate QR Code
                                </Button>
                            </div>
                        )}

                        {profitPaymentStep === "qr" && data.investor.upi_id && (
                            <div className="py-2">
                                <PaymentQR
                                    upiId={data.investor.upi_id}
                                    payeeName={data.investor.name}
                                    amount={parseFloat(profitAmount)}
                                    note={profitDescription || `Profit share for ${data.idea.title}`}
                                    onPaymentComplete={() => setProfitPaymentStep("upload")}
                                />
                                <Button
                                    variant="ghost"
                                    className="w-full mt-2"
                                    onClick={() => setProfitPaymentStep("input")}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {profitPaymentStep === "upload" && (
                            <div className="space-y-4 py-4">
                                <div className="text-center space-y-2">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                                    <h3 className="text-lg font-semibold text-foreground">Payment Sent!</h3>
                                    <p className="text-sm text-slate-400">
                                        Upload a screenshot of your payment confirmation. Investor will need to confirm receipt.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Payment Screenshot</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setProfitProofFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {profitProofFile ? (
                                            <div className="space-y-2">
                                                <ImageIcon className="w-8 h-8 text-emerald-400 mx-auto" />
                                                <p className="text-sm text-emerald-400 font-medium">{profitProofFile.name}</p>
                                                <p className="text-xs text-slate-500">Click to change</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                                                <p className="text-sm text-slate-400">Click or drag to upload screenshot</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setProfitPaymentStep("qr")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        disabled={!profitProofFile || uploadingProfitProof}
                                        onClick={async () => {
                                            if (!profitProofFile) return;
                                            setUploadingProfitProof(true);
                                            try {
                                                // Upload to Supabase Storage
                                                const fileExt = profitProofFile.name.split('.').pop();
                                                const fileName = `profit_${chatRequestId}_${Date.now()}.${fileExt}`;
                                                const { error: uploadError } = await supabase.storage
                                                    .from('payment-proofs')
                                                    .upload(fileName, profitProofFile);

                                                if (uploadError) throw uploadError;

                                                const { data: urlData } = supabase.storage
                                                    .from('payment-proofs')
                                                    .getPublicUrl(fileName);

                                                await handleProfitPaymentComplete(urlData.publicUrl);
                                            } catch (error) {
                                                console.error("Upload error:", error);
                                                toast({ title: "Upload Failed", description: "Failed to upload screenshot. Please try again.", variant: "destructive" });
                                            } finally {
                                                setUploadingProfitProof(false);
                                            }
                                        }}
                                    >
                                        {uploadingProfitProof ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Profit Share Details Dialog */}
                <Dialog open={!!selectedProfitShare} onOpenChange={() => setSelectedProfitShare(null)}>
                    <DialogContent className="bg-white border-border max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                    <PiggyBank className="w-4 h-4 text-emerald-400" />
                                </div>
                                Profit Share Details
                            </DialogTitle>
                        </DialogHeader>

                        {selectedProfitShare && (
                            <div className="space-y-6 pt-4">
                                <div className="text-center">
                                    <p className="text-sm text-slate-500 mb-1">Amount</p>
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {formatCurrency(selectedProfitShare.amount)}
                                    </p>
                                    <Badge variant="outline" className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                                        Confirmed
                                    </Badge>
                                </div>

                                <div className="space-y-3 bg-background p-4 rounded-xl border border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Date</span>
                                        <span className="text-foreground">{new Date(selectedProfitShare.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Time</span>
                                        <span className="text-foreground">{new Date(selectedProfitShare.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-slate-500 mb-1">Description</p>
                                        <p className="text-sm text-slate-700">{selectedProfitShare.description || "No description provided"}</p>
                                    </div>
                                </div>

                                {selectedProfitShare.payment_proof_url ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Payment Proof
                                        </p>
                                        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-brand-yellow/10 group">
                                            <img
                                                src={selectedProfitShare.payment_proof_url}
                                                alt="Payment Proof"
                                                className="w-full h-full object-contain"
                                            />
                                            <a
                                                href={selectedProfitShare.payment_proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Button variant="secondary" size="sm">
                                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                                    View Full Proof
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-brand-yellow/10 rounded-lg text-center text-sm text-slate-500">
                                        No payment proof image attached
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-brand-yellow/10 hover:bg-brand-yellow/20 text-foreground"
                                    onClick={() => setSelectedProfitShare(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
};

export default DealCenter;

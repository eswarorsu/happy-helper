import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Search, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, MapPin, Globe, Filter, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Zap, Heart, ShieldCheck, X, ThumbsUp, Users, Handshake, Store, Receipt, User } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import ChatBox from "@/components/ChatBox";
import { connectFirebase, getUnreadCount, subscribeToUnreadCount } from "@/lib/firebase";
import AnimatedGridBackground from "@/components/AnimatedGridBackground";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#4338ca", "#6366f1", "#818cf8", "#a5b4fc"];

// ============================================================================
// ANIMATION VARIANTS - Premium Fintech Motion
// ============================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

const cardHoverVariants = {
  rest: {
    scale: 1,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

const ideaCardHoverVariants = {
  rest: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.05,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

// Chart data types
interface GrowthDataPoint {
  month: string;
  capital: number;
  profit: number;
}

interface PortfolioDataPoint {
  name: string;
  value: number;
}

interface Profile {
  id: string;
  name: string;
  user_type: string;
  is_approved?: boolean;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  domain: string;
  investment_needed: number;
  investment_received: number;
  status: string;
  created_at: string;
  founder_id: string;
  founder?: { name: string };
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
  founder?: Profile;
  idea?: { title: string; investment_needed: number };
  unread_count?: number;
}

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showChatList, setShowChatList] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCountsRef = useRef<Map<string, number>>(new Map());
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Investor metrics
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProfitReceived, setTotalProfitReceived] = useState(0);

  // Chart data - dynamically computed from real investments
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioDataPoint[]>([]);
  const [trustScore, setTrustScore] = useState({ total: 0, positive: 0, percentage: 0 });

  // Invested ideas - ideas this investor has invested in
  const [investedIdeaIds, setInvestedIdeaIds] = useState<string[]>([]);
  const [investedIdeas, setInvestedIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowChatList(prev => !prev);
      }
      if (e.key === "Escape") {
        setShowChatList(false);
        setSelectedChat(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    fetchData();

    const channel = supabase
      .channel('investor-dashboard-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_requests' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investment_records' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profit_shares' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize Firebase on mount
  useEffect(() => {
    connectFirebase()
      .then(() => {
        console.log("[INVESTOR] Firebase connected successfully");
        setFirebaseReady(true);
      })
      .catch(e => console.error("[INVESTOR] Firebase connection failed:", e));
  }, []);

  // Real-time subscription for unread message counts
  useEffect(() => {
    if (!profile || chatRequests.length === 0 || !firebaseReady) {
      console.log("[INVESTOR] Skipping subscription setup:", {
        hasProfile: !!profile,
        chatCount: chatRequests.length,
        firebaseReady
      });
      return;
    }

    // Cleanup previous subscriptions
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Subscribe to each active chat for real-time unread updates
    const activeChats = chatRequests.filter(r =>
      ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)
    );

    console.log(`[INVESTOR] Setting up subscriptions for ${activeChats.length} active chats`);

    activeChats.forEach(req => {
      // Initialize previous count ONLY if it doesn't exist yet
      if (!previousCountsRef.current.has(req.id)) {
        previousCountsRef.current.set(req.id, req.unread_count || 0);
        console.log(`[INVESTOR] Initialized prevCount for chat ${req.id} to ${req.unread_count || 0}`);
      }

      const unsubscribe = subscribeToUnreadCount(req.id, profile.id, (count) => {
        const prevCount = previousCountsRef.current.get(req.id) || 0;

        console.log(`[INVESTOR] Unread count update for chat ${req.id}:`, {
          chatId: req.id,
          founderName: req.founder?.name,
          newCount: count,
          prevCount: prevCount,
          selectedChatId: selectedChat?.id,
          willShowNotification: count > prevCount && selectedChat?.id !== req.id
        });

        // Update the unread count in state - use functional update to avoid stale closure
        setChatRequests(prev => {
          const updated = prev.map(p =>
            p.id === req.id ? { ...p, unread_count: count } : p
          );
          console.log(`[INVESTOR] State updated - chat ${req.id} now has unread_count: ${count}`);
          return updated;
        });

        // Show notification if new messages arrived and chat is not currently open
        if (count > prevCount && selectedChat?.id !== req.id) {
          const newMessages = count - prevCount;

          // Play notification sound
          if (soundEnabled) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfk77RiGwU7k9bx0H4qBSh+zPLaizsKGGS56+mnVRILSKHh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU=');
            audio.volume = 0.3;
            audio.play().catch(() => { });
          }

          // Show toast notification
          toast({
            title: "💬 New Message",
            description: `${req.founder?.name || 'A founder'} sent you ${newMessages} new message${newMessages > 1 ? 's' : ''}`,
            duration: 5000,
          });
        }

        // Update previous count for next comparison
        previousCountsRef.current.set(req.id, count);
      });

      unsubscribersRef.current.push(unsubscribe);
    });

    // Cleanup on unmount or dependency change
    return () => {
      console.log("[INVESTOR] Cleaning up subscriptions");
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [profile?.id, chatRequests.length, firebaseReady]);

  // Separate effect for notification logic that depends on selectedChat
  const selectedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat?.id]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth?mode=login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profileError || !profileData) {
      navigate("/profile-setup?type=investor");
      return;
    }

    if (profileData.user_type !== "investor") {
      navigate("/founder-dashboard");
      return;
    }

    setProfile(profileData);

    // CRITICAL: Fetch ideas for Hot Domains chart - include all visible statuses
    const { data: ideasData } = await supabase
      .from("ideas")
      .select(`
        *,
        founder:profiles!ideas_founder_id_fkey(name)
      `)
      .in("status", ["pending", "approved", "in_progress", "funded", "deal_done"])
      .order("created_at", { ascending: false });

    setIdeas(ideasData || []);

    const { data: requestsData } = await supabase
      .from("chat_requests")
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, avatar_url, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title, investment_needed)
      `)
      .eq("investor_id", profileData.id);

    setChatRequests(requestsData || []);

    // Fetch investor metrics
    // 1. Total Invested Amount & Chart Data
    const { data: investmentData } = await supabase
      .from("investment_records")
      .select(`
        amount,
        created_at,
        idea_id,
        idea:ideas!investment_records_idea_id_fkey(
          id,
          title,
          description,
          domain,
          investment_needed,
          investment_received,
          status,
          created_at,
          founder_id,
          founder:profiles!ideas_founder_id_fkey(name)
        )
      `)
      .eq("investor_id", profileData.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: true });

    if (investmentData && investmentData.length > 0) {
      const total = investmentData.reduce((sum, inv) => sum + Number(inv.amount), 0);
      setTotalInvested(total);

      // Extract unique invested idea IDs and full Idea objects
      const uniqueIdeaIds = [...new Set(investmentData.map(inv => inv.idea_id))];
      setInvestedIdeaIds(uniqueIdeaIds);

      // Deduplicate ideas for the UI list
      const uniqueIdeasMap = new Map<string, Idea>();
      investmentData.forEach(inv => {
        // @ts-ignore - Supabase join returns the object, manually casting to Idea structure
        if (inv.idea && !uniqueIdeasMap.has(inv.idea_id)) {
          // @ts-ignore
          uniqueIdeasMap.set(inv.idea_id, inv.idea as Idea);
        }
      });
      setInvestedIdeas(Array.from(uniqueIdeasMap.values()));

      // Fetch profit shares for this investor
      const { data: profitData } = await supabase
        .from("profit_shares")
        .select("amount, created_at")
        .eq("investor_id", profileData.id)
        .order("created_at", { ascending: true });

      const totalProfit = profitData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setTotalProfitReceived(totalProfit);

      // Compute growth data - cumulative investments AND profits by month
      const monthlyInvestments: Record<string, number> = {};
      const monthlyProfits: Record<string, number> = {};
      let cumulativeInvest = 0;
      let cumulativeProfit = 0;

      investmentData.forEach(inv => {
        const date = new Date(inv.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        cumulativeInvest += Number(inv.amount);
        monthlyInvestments[monthKey] = cumulativeInvest;
      });

      profitData?.forEach(p => {
        const date = new Date(p.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        cumulativeProfit += Number(p.amount);
        monthlyProfits[monthKey] = cumulativeProfit;
      });

      // Merge all months and create chart data
      const allMonths = [...new Set([...Object.keys(monthlyInvestments), ...Object.keys(monthlyProfits)])];
      let lastInvest = 0;
      let lastProfit = 0;

      const chartData = allMonths.map(month => {
        if (monthlyInvestments[month]) lastInvest = monthlyInvestments[month];
        if (monthlyProfits[month]) lastProfit = monthlyProfits[month];
        return { month, capital: lastInvest, profit: lastProfit };
      });
      setGrowthData(chartData);

      // Compute portfolio distribution by domain
      const domainTotals: Record<string, number> = {};
      investmentData.forEach(inv => {
        const domain = (inv.idea as { domain?: string })?.domain || 'Other';
        domainTotals[domain] = (domainTotals[domain] || 0) + Number(inv.amount);
      });

      const portfolioChartData = Object.entries(domainTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setPortfolioData(portfolioChartData);
    } else {
      // New user with no investments
      setTotalInvested(0);
      setTotalProfitReceived(0);
      setGrowthData([]);
      setPortfolioData([]);
      setInvestedIdeaIds([]);
      setInvestedIdeas([]);
    }

    // 2. Trust Score (from founder ratings)
    const { data: ratingsData } = await supabase
      .from("investor_ratings")
      .select("rating")
      .eq("investor_id", profileData.id);

    if (ratingsData && ratingsData.length > 0) {
      const positiveCount = ratingsData.filter(r => r.rating === true).length;
      const percentage = Math.round((positiveCount / ratingsData.length) * 100);
      setTrustScore({
        total: ratingsData.length,
        positive: positiveCount,
        percentage
      });
    }

    // Fetch initial unread counts (real-time subscription will handle updates)
    if (requestsData && requestsData.length > 0) {
      const activeChats = requestsData.filter(r =>
        ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)
      );

      for (const req of activeChats) {
        try {
          const count = await getUnreadCount(req.id, profileData.id);
          setChatRequests(prev => prev.map(p => p.id === req.id ? { ...p, unread_count: count } : p));
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      }
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleReachOut = async (idea: Idea) => {
    if (!profile) return;

    if (!profile.is_approved) {
      toast({ title: "Verification Required", description: "Wait for an admin to verify your profile.", variant: "destructive" });
      return;
    }

    const existingRequest = chatRequests.find((r) => r.idea_id === idea.id);
    if (existingRequest) {
      const activeStatuses = ["accepted", "communicating", "deal_pending_investor", "deal_done"];
      if (activeStatuses.includes(existingRequest.status)) {
        setSelectedChat(existingRequest);
      } else {
        toast({
          title: "Request pending",
          description: "Your chat request is waiting for approval",
        });
      }
      return;
    }

    const { data, error } = await supabase
      .from("chat_requests")
      .insert({
        idea_id: idea.id,
        investor_id: profile.id,
        founder_id: idea.founder_id,
        status: "pending",
      })
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title, investment_needed)
      `)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: "Waiting for founder's approval" });
      setChatRequests([...chatRequests, data]);
    }
  };

  const getRequestStatus = (ideaId: string) => {
    const request = chatRequests.find((r) => r.idea_id === ideaId);
    return request?.status;
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === "all" || idea.domain.toLowerCase() === selectedDomain.toLowerCase();
    return matchesSearch && matchesDomain;
  });

  const toggleWatchlist = (ideaId: string) => {
    setWatchlist(prev =>
      prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]
    );
    toast({
      title: watchlist.includes(ideaId) ? "Removed from watchlist" : "Added to watchlist",
      duration: 2000
    });
  };

  const marketTrends = Object.entries(
    ideas.reduce((acc: Record<string, number>, idea) => {
      const domain = idea.domain || "Other";
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const domains = ["all", ...new Set(ideas.map((i) => i.domain.toLowerCase()))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatedGridBackground className="bg-slate-50">
      <div className="min-h-screen text-slate-900 font-sans relative">

        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Innovestor</span>
                  {profile?.is_approved && <Badge className="bg-green-500 text-white gap-1 px-2 py-0.5 rounded-full text-[10px]"><ShieldCheck size={12} /> Verified LP</Badge>}
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Investor Hub</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-900">Welcome, {profile?.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="rounded-full w-9 h-9 border border-slate-200 hover:bg-slate-100 transition-all text-slate-700"
              title="View Profile"
            >
              <User size={18} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/marketplace')}
              className="rounded-full font-bold bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700"
            >
              <Store className="w-4 h-4 mr-2" /> Marketplace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/transactions')}
              className="rounded-full font-bold bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700"
            >
              <Receipt className="w-4 h-4 mr-2" /> Transactions
            </Button>
            <div className="relative">
              <Button
                variant={showChatList ? "default" : "outline"}
                size="sm"
                onClick={() => setShowChatList(!showChatList)}
                className="rounded-full font-bold relative"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Messages
                {chatRequests.filter(r => r.unread_count && r.unread_count > 0).length > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                      {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0)}
                    </span>
                    <span className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full animate-ping opacity-75"></span>
                  </>
                )}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full font-bold">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </motion.header>

        <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
          >
            {[
              {
                label: "Total Invested",
                value: totalInvested > 0 ? `₹${(totalInvested / 100000).toFixed(1)}L` : "₹0",
                icon: DollarSign,
                color: "text-indigo-600",
                bgColor: "bg-indigo-50",
                trend: totalInvested > 0 ? "Active" : "Start investing",
                positive: totalInvested > 0
              },
              {
                label: "Active Deals",
                value: chatRequests.filter(r => r.status === 'deal_done').length,
                icon: Handshake,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50",
                trend: chatRequests.filter(r => r.status === 'deal_done').length > 0 ? "Ongoing" : "No deals yet",
                positive: chatRequests.filter(r => r.status === 'deal_done').length > 0
              },
              {
                label: "Connections",
                value: chatRequests.filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)).length,
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                trend: `${chatRequests.filter(r => r.status === "pending").length} pending`,
                positive: true
              },
              {
                label: "Trust Score",
                value: trustScore.total > 0 ? `${trustScore.percentage}%` : "New",
                icon: ThumbsUp,
                color: trustScore.percentage >= 70 ? "text-green-600" : trustScore.percentage >= 40 ? "text-amber-600" : "text-slate-600",
                bgColor: trustScore.percentage >= 70 ? "bg-green-50" : trustScore.percentage >= 40 ? "bg-amber-50" : "bg-slate-50",
                trend: trustScore.total > 0 ? `${trustScore.positive}/${trustScore.total} ratings` : "No ratings yet",
                positive: trustScore.percentage >= 50
              },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <motion.div
                  initial="rest"
                  whileHover="hover"
                  variants={cardHoverVariants}
                >
                  <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${stat.positive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                          {stat.trend}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid lg:grid-cols-3 gap-8 mb-10"
          >
            <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">Portfolio Growth & Profits</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                      <span className="text-xs font-medium text-slate-600">Invested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-slate-600">Profit</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {growthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4338ca" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4338ca" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'white' }}
                        formatter={(value: number, name: string) => [
                          `₹${value.toLocaleString()}`,
                          name === 'capital' ? 'Invested' : 'Profit Received'
                        ]}
                      />
                      <Area type="monotone" dataKey="capital" stroke="#4338ca" fillOpacity={1} fill="url(#colorCapital)" strokeWidth={3} name="capital" />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} name="profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                      <TrendingUp className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-slate-600 font-semibold mb-1">No Investment History Yet</p>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Your portfolio growth will appear here once you start investing in startups.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                <CardTitle className="text-lg font-bold text-slate-900">Your Investment Domains</CardTitle>
                <CardDescription className="text-xs text-slate-500">Domains you've invested in</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={portfolioData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={80}
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Invested']}
                        />
                        <Bar dataKey="value" fill="#4338ca" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Top Investment</p>
                      <p className="text-[11px] text-indigo-900 font-medium">
                        {portfolioData[0].name} is your top sector with ₹{portfolioData[0].value.toLocaleString()} invested.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold mb-1">No Investments Yet</p>
                    <p className="text-xs text-slate-400">Your investment domains will appear here after you complete deals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============ MY PORTFOLIO SECTION ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Portfolio</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Founders you've connected with or invested in</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-1.5 rounded-full font-bold flex gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {chatRequests.filter(r => ['accepted', 'communicating', 'deal_pending_investor', 'deal_done'].includes(r.status)).length} Active Connections
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {chatRequests
                .filter(r => ['accepted', 'communicating', 'deal_pending_investor', 'deal_done'].includes(r.status))
                .map((request) => {
                  const idea = ideas.find(i => i.id === request.idea_id);
                  if (!idea) return null;

                  const isInvested = request.status === 'deal_done';

                  return (
                    <motion.div
                      key={idea.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`transition-all duration-300 group overflow-hidden rounded-[20px] flex flex-col relative h-full ${isInvested
                          ? 'border-emerald-200 bg-[#F0FDF8] shadow-sm'
                          : 'border-slate-100 bg-white shadow-lg'
                          } border-[1.5px]`}
                      >
                        <CardHeader className="pb-3 pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={`${isInvested ? 'bg-[#10B981]' : 'bg-indigo-600'} text-white border-none gap-1 px-3 py-1 text-[10px] font-bold rounded-full`}>
                              {isInvested ? '✓' : <Activity size={12} />} {isInvested ? 'Invested' : 'Connected'}
                            </Badge>
                            <span className={`text-[11px] font-black uppercase tracking-wider ${isInvested ? 'text-[#10B981]' : 'text-indigo-600'}`}>
                              {idea.domain}
                            </span>
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {idea.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col pt-0">
                          <p className="text-[13px] text-slate-600/80 mb-6 line-clamp-2 leading-relaxed font-medium">
                            {idea.description}
                          </p>

                          <div className="mt-auto">
                            <div className="flex items-center justify-between text-[13px] font-medium text-slate-500 mb-6">
                              <span>By {request.founder?.name || 'Loading...'}</span>
                              <span className={`font-bold ${isInvested ? 'text-[#10B981]' : 'text-indigo-600'}`}>
                                ₹{(idea.investment_received || 0).toLocaleString()} raised
                              </span>
                            </div>

                            <Button
                              className={`w-full h-11 rounded-xl font-bold transition-all ${isInvested
                                ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                } border-none shadow-none`}
                              onClick={() => setSelectedChat(request)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Enter Private Portal
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>

            {chatRequests.filter(r => ['accepted', 'communicating', 'deal_pending_investor', 'deal_done'].includes(r.status)).length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Your portfolio is waiting</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                  Once you reach out to founders and they accept your connection, your investments will appear here.
                </p>
              </div>
            )}
          </motion.div>
        </main>

        {/* ============================================================== */}
        {/* CHAT LIST PANEL - LinkedIn Style */}
        {/* ============================================================== */}
        <AnimatePresence>
          {showChatList && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-[73px] bottom-0 w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl z-50"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                      {chatRequests.filter(r => r.unread_count && r.unread_count > 0).length > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                        >
                          {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0)} new
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="h-8 w-8 rounded-full hover:bg-slate-200"
                        title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                      >
                        {soundEnabled ? (
                          <Activity className="w-4 h-4 text-green-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                      {chatRequests.filter(r => r.unread_count && r.unread_count > 0).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setChatRequests(prev => prev.map(r => ({ ...r, unread_count: 0 })));
                            toast({ title: "All messages marked as read" });
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 h-8"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowChatList(false)}
                        className="h-8 w-8 rounded-full hover:bg-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant={messageFilter === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMessageFilter("all")}
                      className="flex-1 h-8 text-xs rounded-lg"
                    >
                      All ({chatRequests.filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)).length})
                    </Button>
                    <Button
                      variant={messageFilter === "unread" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMessageFilter("unread")}
                      className="flex-1 h-8 text-xs rounded-lg"
                    >
                      Unread ({chatRequests.filter(r => r.unread_count && r.unread_count > 0).length})
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Tip: Press Ctrl+M to toggle messages</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {chatRequests.filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-500">No active conversations</p>
                      <p className="text-xs text-slate-400 mt-1">Connect with founders to start chatting</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {chatRequests
                        .filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)).filter(r => messageFilter === "all" || (messageFilter === "unread" && r.unread_count && r.unread_count > 0)).map((chat) => (
                          <motion.button
                            key={chat.id}
                            onClick={() => {
                              setSelectedChat(chat);
                              setShowChatList(false);
                              setChatRequests(prev => prev.map(x => x.id === chat.id ? { ...x, unread_count: 0 } : x));
                            }}
                            className={`w-full p-3 rounded-lg text-left transition-all relative ${selectedChat?.id === chat.id
                              ? 'bg-indigo-50 border border-indigo-200'
                              : chat.unread_count && chat.unread_count > 0
                                ? 'bg-blue-50/50 border border-blue-200 hover:bg-blue-50'
                                : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {chat.unread_count && chat.unread_count > 0 && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-lg"></div>
                            )}
                            <div className="flex items-start justify-between mb-1">
                              <p className={`text-sm truncate flex-1 ${chat.unread_count && chat.unread_count > 0 ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'
                                }`}>
                                {chat.founder?.name || "Founder"}
                              </p>
                              {chat.unread_count && chat.unread_count > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-2 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-indigo-500/50"
                                >
                                  {chat.unread_count}
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-1">
                              {chat.idea?.title || "Investment Opportunity"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mb-2 italic">
                              {chat.unread_count && chat.unread_count > 0 ? `${chat.unread_count} new message${chat.unread_count > 1 ? 's' : ''}` : 'No new messages'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[9px] font-bold bg-slate-100 text-slate-600 border-slate-200">
                                {chat.status === "deal_done" ? "Deal Closed" : "Active"}
                              </Badge>
                              <span className="text-[9px] text-slate-400">• Just now</span>
                            </div>
                          </motion.button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* RIGHT PANEL - Chat */}
        {/* ============================================================== */}
        <AnimatePresence>
          {selectedChat && profile && !showChatList && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-[73px] bottom-0 w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl z-40"
            >
              <ChatBox
                chatRequest={selectedChat}
                currentUserId={profile.id}
                onClose={() => setSelectedChat(null)}
                onMessagesRead={() => {
                  setChatRequests(prev => prev.map(x => x.id === selectedChat.id ? { ...x, unread_count: 0 } : x));
                }}
                variant="embedded"
                className="h-full"
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </AnimatedGridBackground>
  );
};

export default InvestorDashboard;

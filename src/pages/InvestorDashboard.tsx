import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Search, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, MapPin, Globe, Filter, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Zap, Heart, ShieldCheck, X, ThumbsUp, Users, Handshake, Store, Receipt, User, Bell } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import ChatBox from "@/components/ChatBox";
import { connectFirebase, getUnreadCount, subscribeToUnreadCount } from "@/lib/firebase";
import { ProfileViewModal } from "@/components/ProfileViewModal";
// AnimatedGridBackground removed in redesign
import { motion, AnimatePresence } from "framer-motion";

import { MobileNav } from "@/components/layout/MobileNav";
import { InvestorSidebar } from "@/components/layout/InvestorSidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = ["#EFBF04", "#F5C518", "#FFD700", "#FDB813"];

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
  avatar_url?: string | null;
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

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  redirect_url?: string;
  is_read: boolean;
  created_at: string;
}

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
  const [profileToView, setProfileToView] = useState<any | null>(null);

  const [chatWidth, setChatWidth] = useState(400); // Default width
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isResizing, setIsResizing] = useState(false); // Track resizing state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // State for unread counts map
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Calculate total unread count for the notification badge
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchData()
      )
      .subscribe();

    // POLING BACKUP: Fetch data every 10 seconds to ensure notifications are synced
    // This guarantees the bell icon updates even if Realtime events are missed
    const intervalId = setInterval(fetchData, 10000);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      supabase.removeChannel(channel);
      clearInterval(intervalId);
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
    if (!profile || chatRequests.length === 0 || !firebaseReady) return;

    // Cleanup previous subscriptions
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Subscribe to active chats
    const activeChats = chatRequests.filter(r =>
      ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)
    );

    activeChats.forEach(req => {
      // @ts-ignore - firebase types might be lagging
      const unsubscribe = subscribeToUnreadCount(req.id, profile.id, (count, lastMessage) => {
        // Update state map
        setUnreadCounts(prev => {
          const prevCount = prev[req.id] || 0;

          // Notification logic: Only if count INCREASED and chat is not open
          if (count > prevCount && selectedChatIdRef.current !== req.id) {
            const newMessages = count - prevCount;

            // Determine Notification Style based on Message Content
            let toastVariant: "default" | "destructive" = "default";
            let toastTitle = `💬 Message from ${req.founder?.name || 'Founder'}`;
            let toastClass = "";
            const content = lastMessage?.content || "";

            // Smart Formatting for Notifications
            let displayDescription = content;
            const isUrl = content.match(/^https?:\/\//i) || content.includes("supabase.co");
            const founderName = req.founder?.name || "The founder";

            if (content.match(/Profit|Dividends|Payout|₹/i)) {
              toastTitle = "💰 Profit Received";
              toastClass = "bg-emerald-600 text-white border-emerald-700 shadow-lg";
              if (isUrl) {
                displayDescription = `${founderName} sent a profit payment proof`;
              } else {
                displayDescription = `${founderName}: ${content}`;
              }
            } else if (content.match(/Payment|Transaction|Confirm|Receipt|Sent|Received|Proof/i)) {
              toastTitle = "💸 Payment Update";
              toastClass = "bg-indigo-600 text-white border-indigo-700 shadow-lg";
              if (isUrl) {
                displayDescription = `${founderName} sent a payment proof screenshot`;
              } else {
                displayDescription = `${founderName}: ${content}`;
              }
            } else if (content.match(/Reinvest|Request|Refund|Propos|Deal|🚨/i)) {
              toastTitle = "🚨 Action Required";
              toastClass = "bg-rose-600 text-white border-rose-700 shadow-lg";
              toastVariant = "destructive";
              displayDescription = content ? `${founderName}: ${content}` : `${founderName} sent an update`;
            } else if (isUrl) {
              displayDescription = `${founderName} shared an image attachment`;
            } else if (content) {
              displayDescription = `${founderName}: ${content}`;
            } else {
              displayDescription = `${founderName} sent you ${newMessages} new message${newMessages > 1 ? "s" : ""}`;
            }

            if (true) {
              // Money Out / Alert (Red) - "Reinvestment Request"
              if (content.match(/Reinvest|Request|Refund|Propos|Deal|🚨/i)) {
                toastTitle = "🚨 Action Required";
                toastClass = "bg-rose-600 text-white border-rose-700";
                toastVariant = "destructive";
              }

              // Play notification sound
              if (soundEnabled) {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfk77RiGwU7k9bx0H4qBSh+zPLaizsKGGS56+mnVRILSKHh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU');
                audio.volume = 0.3;
                audio.play().catch(() => { });
              }
              toast({
                title: toastTitle,
                description: displayDescription || "New message received",
                duration: 5000,
                className: `${toastClass} shadow-xl`,
                variant: toastVariant
              });
            }
          }
          return { ...prev, [req.id]: count };
        });
      });
      unsubscribersRef.current.push(unsubscribe);
    });

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [chatRequests.map(r => `${r.id}-${r.status}`).join(','), profile?.id, firebaseReady]); // Robust dependency including status

  // Separate effect for notification logic that depends on selectedChat
  const selectedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
    // Clear unread count when opening a chat
    if (selectedChat?.id) {
      setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));
    }
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
    const { data: investmentData } = await (supabase as any)
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
      const uniqueIdeaIds = [...new Set(investmentData.map((inv: any) => inv.idea_id))] as string[];
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
      const { data: profitData } = await (supabase as any)
        .from("profit_shares")
        .select("amount, created_at")
        .eq("investor_id", profileData.id)
        .order("created_at", { ascending: true });

      const totalProfit = profitData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setTotalProfitReceived(totalProfit);

      // Compute growth data - cumulative investments AND profits by month
      // Improved Growth Data Calculation: Timeline based
      const timelineEvents: { date: number; amount: number; type: 'invest' | 'profit' }[] = [];

      investmentData.forEach(inv => {
        timelineEvents.push({
          date: new Date(inv.created_at).getTime(),
          amount: Number(inv.amount),
          type: 'invest'
        });
      });

      profitData?.forEach(p => {
        timelineEvents.push({
          date: new Date(p.created_at).getTime(),
          amount: Number(p.amount),
          type: 'profit'
        });
      });

      // Sort chronological
      timelineEvents.sort((a, b) => a.date - b.date);

      // Create cumulative daily points
      const dailyMap = new Map<string, { invest: number, profit: number }>();
      let runningInvest = 0;
      let runningProfit = 0;

      timelineEvents.forEach(e => {
        // e.g. "8 Feb 26"
        const dateStr = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

        if (e.type === 'invest') runningInvest += e.amount;
        else runningProfit += e.amount;

        // Map preserves insertion order, so we accept the latest value for the day
        dailyMap.set(dateStr, { invest: runningInvest, profit: runningProfit });
      });

      const chartData = Array.from(dailyMap.entries()).map(([month, data]) => ({
        month, // Using 'month' key to stay compatible with Chart component props
        capital: data.invest,
        profit: data.profit
      }));

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
    const { data: ratingsData } = await (supabase as any)
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


    // 3. Fetch Notifications
    const { data: notifData } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setNotifications(notifData || []);

    // Initial fetch of unread counts REMOVED to avoid race conditions.
    // The useEffect subscription handles this automatically and consistently.
    // If we fetch manually here, we risk overwriting the real-time state with potentially stale data
    // or causing flickers. The real-time listener will fire immediately upon connection anyway.

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const markNotificationAsRead = async (id: string, redirectUrl?: string) => {
    try {
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

      if (redirectUrl) {
        navigate(redirectUrl);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
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

  useEffect(() => {
    fetchData();

    // ---------------------------------------------------------
    // REAL-TIME LISTENER FOR CHAT REQUESTS & STATUS UPDATES
    // ---------------------------------------------------------
    if (profile?.id) {
      const channel = supabase
        .channel(`investor-chats-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for INSERT and UPDATE
            schema: 'public',
            table: 'chat_requests',
            filter: `investor_id=eq.${profile.id}`
          },
          async (payload) => {
            console.log('[REALTIME] Chat request update:', payload);

            // If it's an update, reflect it in the state immediately
            if (payload.eventType === 'UPDATE') {
              setChatRequests((prev) =>
                prev.map((req) => req.id === payload.new.id ? { ...req, ...payload.new } : req)
              );

              // Also receive the FULL updated object if needed, or just partial is fine for status
              // If selected chat is the one updated, update it too so ChatBox gets new props
              if (selectedChatIdRef.current === payload.new.id) {
                setSelectedChat((prev) => prev ? { ...prev, ...payload.new } : null);
              }
            } else if (payload.eventType === 'INSERT') {
              // For inserts, we might need to fetch relations (founder/idea) so easy way is re-fetch or careful manual merge
              // Re-fetching strictly the new row is cleaner
              const { data } = await supabase
                .from('chat_requests')
                .select(`
                    *,
                    founder:profiles!chat_requests_founder_id_fkey(*),
                    idea:ideas(*)
                 `)
                .eq('id', payload.new.id)
                .single();

              if (data) {
                setChatRequests(prev => [data, ...prev]);
                toast({
                  title: "New Connect Request!",
                  description: `${data.founder?.name} wants to connect regarding ${data.idea?.title}`,
                  className: "bg-brand-yellow text-brand-charcoal"
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id, supabase, setChatRequests, setSelectedChat, selectedChatIdRef]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }



  return (
    <div className="flex min-h-screen lg:h-screen bg-background text-foreground font-sans">
      {/* Left Sidebar — desktop only */}
      <InvestorSidebar
        userName={profile?.name}
        onLogout={handleLogout}
        unreadCount={totalUnreadCount}
        onMessagesClick={() => setShowChatList(!showChatList)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile header — visible only below lg */}
        <header className="lg:hidden sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-base font-black tracking-tight text-foreground uppercase">Innovestor</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 border border-border hover:bg-secondary text-muted-foreground" aria-label="Notifications">
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-1rem)] max-w-sm p-0 mr-0 sm:mr-4 mt-2 bg-background border-border shadow-xl rounded-xl" align="end">
                <div className="p-4 border-b border-border/60 flex justify-between items-center bg-secondary/30 rounded-t-xl">
                  <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
                  {notifications.length > 0 && (
                    <span className="text-xs text-muted-foreground">{notifications.filter(n => !n.is_read).length} unread</span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id, notification.redirect_url)}
                        className={`p-4 border-b border-border/30 hover:bg-secondary/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          <div>
                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <MobileNav
              userType="investor"
              userName={profile?.name}
              onLogout={handleLogout}
              unreadCount={totalUnreadCount}
              onMessagesClick={() => setShowChatList(!showChatList)}
            />
          </div>
        </header>

        <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-10 py-4 sm:py-6 sm:py-8">
          {/* ===== Company Header Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/60 flex items-center justify-center border border-slate-600">
                  <span className="text-2xl font-black text-white">{profile?.name?.charAt(0) || 'I'}</span>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{profile?.name || 'Investor'}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {profile?.is_approved && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 text-[10px]">
                        <ShieldCheck size={12} /> Verified LP
                      </Badge>
                    )}
                    <span className="text-sm text-slate-400">Investor Hub</span>
                  </div>
                </div>
                {/* Desktop notification bell */}
                <div className="hidden lg:flex items-center gap-2 sm:ml-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 border border-slate-600 hover:bg-slate-700 text-slate-300" aria-label="Notifications">
                        <Bell className="w-5 h-5" />
                        {notifications.some(n => !n.is_read) && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-1rem)] max-w-sm p-0 mr-0 sm:mr-4 mt-2 bg-background border-border shadow-xl rounded-xl" align="end">
                      <div className="p-4 border-b border-border/60 flex justify-between items-center bg-secondary/30 rounded-t-xl">
                        <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
                        {notifications.length > 0 && (
                          <span className="text-xs text-muted-foreground">{notifications.filter(n => !n.is_read).length} unread</span>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              onClick={() => markNotificationAsRead(notification.id, notification.redirect_url)}
                              className={`p-4 border-b border-border/30 hover:bg-secondary/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                <div>
                                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Inline metric stats row */}
              {/* Pearl Street Style Metrics Row */}
              <div className="mt-4 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                {[
                  {
                    label: "Total Invested",
                    value: totalInvested > 0 ? `₹${(totalInvested).toLocaleString()}` : "₹0",
                    trend: "+12.5%",
                    trendUp: true,
                    icon: TrendingUp
                  },
                  {
                    label: "Profit Received",
                    value: totalProfitReceived > 0 ? `₹${(totalProfitReceived).toLocaleString()}` : "₹0",
                    trend: "+8.2%",
                    trendUp: true,
                    icon: Zap
                  },
                  {
                    label: "Portfolio Value",
                    value: `₹${(totalInvested + totalProfitReceived + (chatRequests.filter(r => r.status === 'deal_done').length * 50000)).toLocaleString()}`, // Mock valuation logic
                    trend: "Est.",
                    trendUp: true,
                    icon: PieChartIcon
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/40 p-3 sm:p-6 flex flex-col justify-between group hover:bg-slate-800/60 transition-colors relative">
                    {i < 2 && <div className="absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent hidden md:block" />}

                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-brand-yellow group-hover:bg-brand-yellow/10 transition-colors`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    </div>

                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="flex items-center gap-2">
                        {stat.trendUp ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
                        <span className={cn("text-xs font-medium", stat.trendUp ? "text-emerald-400" : "text-rose-400")}>{stat.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            {/* Left Col: Growth Chart (Cash on Hand equivalent) */}
            <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Portfolio Growth</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">Accumulated value over time</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-700" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Invested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Profit</span>
                    </div>
                  </div>
                </div>
                {/* Summary Stats above chart like Reference */}
                <div className="flex gap-8 mt-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Current Value</p>
                    <p className="text-lg font-bold text-slate-900">₹{(totalInvested + totalProfitReceived).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net Profit</p>
                    <p className="text-lg font-bold text-emerald-600">+₹{totalProfitReceived.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {growthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4338ca" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#4338ca" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'white' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(value: number, name: string) => [
                          `₹${value.toLocaleString()}`,
                          name === 'capital' ? 'Invested' : 'Profit'
                        ]}
                      />
                      <Area type="monotone" dataKey="capital" stroke="#4338ca" strokeWidth={2} fillOpacity={1} fill="url(#colorCapital)" name="capital" />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                      <TrendingUp className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-900 font-medium text-sm mb-1">No Data Available</p>
                    <p className="text-xs text-slate-400 max-w-[200px]">
                      Start investing to see your portfolio growth visualization.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Col: Upgrade / Info Card */}
            <div className="bg-brand-charcoal rounded-xl p-6 text-white overflow-hidden relative shadow-lg shadow-brand-yellow/20 flex flex-col justify-between">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 p-12 bg-brand-yellow/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-10 bg-brand-yellow/10 rounded-full blur-xl -ml-10 -mb-5 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 bg-brand-yellow/20 w-fit px-2 py-1 rounded-md backdrop-blur-sm">
                  <Activity className="w-3 h-3 text-brand-yellow" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-yellow">Premium Access</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Unlock Pearl Street+ Intelligence</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Get advanced market insights, cap table modeling, and exclusive deal flow access.
                </p>
              </div>

              <div className="relative z-10">
                <Button className="w-full bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/90 font-bold border-0 shadow-none">
                  Upgrade Plan <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ============ STAKEHOLDER TABLE ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8"
          >
            <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Stakeholder</h2>
                <Button variant="outline" size="sm" className="h-8 text-xs">View All</Button>
              </div>

              {chatRequests.filter(r => ['accepted', 'communicating', 'deal_pending_investor', 'deal_done'].includes(r.status)).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No active stakeholders</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Connect with founders to build your portfolio.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Table header */}
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4 px-6 py-3 border-b border-slate-50 bg-slate-50/50 text-xs font-semibold text-slate-500">
                    <div className="w-5 h-5 border border-slate-300 rounded flex items-center justify-center bg-white" />
                    <div>Stakeholder</div>
                    <div>Ownership</div>
                    <div className="text-right">Cash Raised</div>
                  </div>

                  {/* Table rows */}
                  {chatRequests
                    .filter(r => ['accepted', 'communicating', 'deal_pending_investor', 'deal_done'].includes(r.status))
                    .map((request) => {
                      const idea = ideas.find(i => i.id === request.idea_id);
                      if (!idea) return null;
                      const isInvested = request.status === 'deal_done';

                      // Mock ownership/progress based on status
                      let progress = 10;
                      if (request.status === 'communicating') progress = 30;
                      if (request.status === 'deal_pending_investor') progress = 75;
                      if (request.status === 'deal_done') progress = 100;

                      return (
                        <button
                          key={request.id}
                          onClick={() => setSelectedChat(request)}
                          className="w-full grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4 px-6 py-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors text-left group"
                        >
                          {/* Checkbox visual */}
                          <div className="w-5 h-5 border border-slate-300 rounded flex items-center justify-center bg-white group-hover:border-brand-yellow transition-colors">
                            {isInvested && <div className="w-3 h-3 bg-brand-yellow rounded-sm" />}
                          </div>

                          {/* Stakeholder Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                              {request.founder?.avatar_url ? (
                                <img src={request.founder.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100">
                                  {(request.founder?.name || 'F').charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{request.founder?.name || 'Founder'}</p>
                              <p className="text-xs text-slate-500 truncate">{idea.title}</p>
                            </div>
                          </div>

                          {/* Ownership / Progress */}
                          <div className="w-full max-w-[180px]">
                            <div className="flex justify-between text-[10px] mb-1.5">
                              <span className="font-medium text-slate-600">{progress}% Stake</span>
                              {isInvested && <span className="font-bold text-emerald-600">Active</span>}
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-1000", isInvested ? "bg-brand-yellow" : "bg-slate-300")}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Cash Raised */}
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">₹{(idea.investment_received || 0).toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </Card>
          </motion.div>
        </main>
      </div>

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
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-md border-l border-border shadow-2xl z-50"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">Messages</h2>
                    {totalUnreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                      >
                        {totalUnreadCount} new
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="h-8 w-8 rounded-full hover:bg-secondary"
                      aria-label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                      title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                    >
                      {soundEnabled ? (
                        <Activity className="w-4 h-4 text-green-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    {totalUnreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUnreadCounts({});
                          toast({ title: "All messages marked as read" });
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground h-8"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowChatList(false)}
                      className="h-8 w-8 rounded-full hover:bg-secondary"
                      aria-label="Close chat panel"
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
                    Unread ({chatRequests.filter(r => (unreadCounts[r.id] || 0) > 0).length})
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2">Tip: Press Ctrl+M to toggle messages</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chatRequests.filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No active conversations</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Connect with founders to start chatting</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {chatRequests
                      .filter(r => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status))
                      .filter(r => messageFilter === "all" || (messageFilter === "unread" && (unreadCounts[r.id] || 0) > 0))
                      .sort((a, b) => (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0))
                      .map((chat) => {
                        const count = unreadCounts[chat.id] || 0;
                        return (
                          <motion.button
                            key={chat.id}
                            onClick={() => {
                              setSelectedChat(chat);
                              setShowChatList(false);
                              setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
                            }}
                            className={`w-full p-3 rounded-lg text-left transition-all relative ${selectedChat?.id === chat.id
                              ? 'bg-primary/10 border border-primary/20'
                              : count > 0
                                ? 'bg-primary/5 border border-primary/10 hover:bg-primary/10'
                                : 'hover:bg-secondary border border-transparent'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {count > 0 && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
                            )}
                            <div className="flex items-start justify-between mb-1">
                              <p className={`text-sm truncate flex-1 ${count > 0 ? 'font-extrabold text-foreground' : 'font-bold text-muted-foreground'
                                }`}>
                                {chat.founder?.name || "Founder"}
                              </p>
                              {count > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-primary/50"
                                >
                                  {count}
                                </motion.span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {chat.idea?.title || "Investment Opportunity"}
                            </p>
                            <p className="text-[11px] text-muted-foreground/60 truncate mb-2 italic">
                              {count > 0 ? `${count} new message${count > 1 ? 's' : ''}` : 'No new messages'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[9px] font-bold bg-secondary text-muted-foreground border-border">
                                {chat.status === "deal_done" ? "Deal Closed" : "Active"}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground/60">• Just now</span>
                            </div>
                          </motion.button>
                        )
                      })}
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
        {selectedChat && profile && (
          <>
            {/* Resize Overlay - active only during resize to capture mouse events everywhere */}
            {isResizing && !isMobile && (
              <div
                className="fixed inset-0 z-50 cursor-ew-resize"
                onMouseMove={(e) => {
                  const newWidth = window.innerWidth - e.clientX;
                  if (newWidth > 300 && newWidth < 800) {
                    setChatWidth(newWidth);
                  }
                }}
                onMouseUp={() => setIsResizing(false)}
                onMouseLeave={() => setIsResizing(false)}
              />
            )}

            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: isMobile ? "100vw" : chatWidth }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-auto bg-background/95 backdrop-blur-md border-l border-border shadow-2xl z-40 flex"
            >
              {/* Drag Handle */}
              <div
                className="hidden md:flex w-1.5 h-full cursor-ew-resize hover:bg-primary/30 transition-colors items-center justify-center group"
                onMouseDown={(e) => {
                  if (isMobile) return;
                  e.preventDefault();
                  setIsResizing(true);
                }}
              >
                <div className="w-0.5 h-8 bg-muted-foreground/30 group-hover:bg-primary rounded-full" />
              </div>

              <div className="flex-1 h-full min-w-0">
                <ChatBox
                  chatRequest={selectedChat}
                  currentUserId={profile.id}
                  onClose={() => setSelectedChat(null)}
                  onMessagesRead={() => {
                    setChatRequests(prev => prev.map(x => x.id === selectedChat.id ? { ...x, unread_count: 0 } : x));
                  }}
                  onViewProfile={async () => {
                    // Investor viewing Founder
                    if (!selectedChat.founder_id) return;
                    const { data } = await supabase.from('profiles').select('*').eq('id', selectedChat.founder_id).single();
                    if (data) setProfileToView(data);
                  }}
                  variant="embedded"
                  className="h-full"
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <ProfileViewModal
        isOpen={!!profileToView}
        onClose={() => setProfileToView(null)}
        profile={profileToView}
      />
    </div>
  );
};

export default InvestorDashboard;


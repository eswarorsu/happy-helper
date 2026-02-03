import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket, Plus, LogOut, MessageSquare, DollarSign, Lightbulb,
  User, ExternalLink, Pin, Search, Bell, ChevronRight,
  ArrowUpRight, Building2, Users, Target, CheckCircle2, X, ChevronLeft,
  Activity, LucideIcon, ThumbsUp, ThumbsDown
} from "lucide-react";
import ChatBox from "@/components/ChatBox";
import AnimatedGridBackground from "@/components/AnimatedGridBackground";
import { getUnreadCount, connectFirebase, subscribeToUnreadCount } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
      ease: [0.25, 0.46, 0.45, 0.94] as const // easeOutQuad
    }
  }
};

const cardHoverVariants = {
  rest: {
    y: 0,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
  },
  hover: {
    y: -2,
    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    transition: {
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" as const }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2, ease: "easeIn" as const }
  }
};

// ============================================================================
// TYPES
// ============================================================================
interface Profile {
  id: string;
  name: string;
  user_type: string;
  is_approved?: boolean;
  avatar_url?: string;
  email?: string;
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
  media_url?: string;
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
  investor?: { id: string; name: string; avatar_url?: string };
  idea?: { title: string };
  unread_count?: number;
  founder_pinned?: boolean;
}

// ============================================================================
// METRIC CARD COMPONENT - Premium with Motion
// ============================================================================
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "slate",
  index = 0
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accentColor?: "slate" | "emerald" | "amber" | "blue";
  index?: number;
}) => {
  const accentStyles = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700"
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <motion.div variants={cardHoverVariants}>
        <Card className="border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm hover:border-slate-300 transition-colors duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <motion.div
                className={`p-2.5 rounded-lg ${accentStyles[accentColor]}`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              {trend && (
                <motion.div
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <ArrowUpRight className={`w-3 h-3 ${!trend.positive && "rotate-180"}`} />
                  {trend.value}
                </motion.div>
              )}
            </div>
            <div>
              <motion.p
                className="text-2xl font-bold text-slate-900 tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                {value}
              </motion.p>
              <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// VENTURE CARD COMPONENT - Premium with Motion
// ============================================================================
const VentureCard = ({
  idea,
  onClick,
  onRecordInvestment,
  index = 0
}: {
  idea: Idea;
  onClick: () => void;
  onRecordInvestment?: () => void;
  index?: number;
}) => {
  const progressPercent = Math.min((idea.investment_received / idea.investment_needed) * 100, 100);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "funded": return { label: "Funded", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "deal_done": return { label: "Completed", className: "bg-blue-50 text-blue-700 border-blue-200" };
      case "in_progress": return { label: "Active", className: "bg-amber-50 text-amber-700 border-amber-200" };
      default: return { label: status.replace("_", " "), className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  const statusConfig = getStatusConfig(idea.status);

  return (
    <motion.div
      variants={itemVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="cursor-pointer relative group"
    >
      <motion.div
        variants={cardHoverVariants}
        className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 transition-all duration-300"
        style={{
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
        }}
        whileHover={{
          boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(148, 163, 184, 0.2)"
        }}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-medium border-slate-200 text-slate-600 bg-slate-50/80">
                {idea.domain}
              </Badge>
              <Badge variant="outline" className={`text-xs font-medium border ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
              {idea.title}
            </h3>
          </div>
          <motion.div
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-4" />
          </motion.div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{idea.description}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Funding Progress</span>
            <motion.span
              className="font-semibold text-slate-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              {progressPercent.toFixed(0)}%
            </motion.span>
          </div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>${(idea.investment_received || 0).toLocaleString()} raised</span>
            <span>${idea.investment_needed.toLocaleString()} goal</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// CONNECTION ITEM COMPONENT
// ============================================================================
const ConnectionItem = ({
  chat,
  isSelected,
  onSelect,
  onPin,
  onRate,
  currentRating,
  collapsed = false
}: {
  chat: ChatRequest;
  isSelected: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onRate?: (rating: boolean) => void;
  currentRating?: boolean | null;
  collapsed?: boolean;
}) => (
  <motion.div
    onClick={onSelect}
    whileHover={{ scale: 1.02, backgroundColor: "rgba(241, 245, 249, 0.8)" }}
    whileTap={{ scale: 0.98 }}
    layout
    className={`group relative rounded-xl cursor-pointer transition-all duration-300 border ${isSelected
      ? "bg-white border-indigo-200 shadow-md shadow-indigo-100/50"
      : "border-transparent hover:border-slate-200"
      } ${collapsed ? 'py-3 px-1 flex justify-center' : 'p-3 mb-2'}`}
  >
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
      <div className="relative">
        <Avatar className={`border-2 shadow-sm shrink-0 transition-all duration-300 ${isSelected ? "border-indigo-500 ring-2 ring-indigo-100" : "border-white"
          } ${collapsed ? "w-10 h-10" : "w-10 h-10"}`}>
          <AvatarImage src={chat.investor?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm">
            {chat.investor?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {chat.unread_count && chat.unread_count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-red-500/50 z-10 animate-pulse"
          >
            {chat.unread_count}
          </motion.span>
        )}
        {/* Online Status Dot (Simulated for generic "active") */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm z-10" />
      </div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-sm font-bold truncate ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
              {chat.investor?.name}
            </p>
            {chat.founder_pinned && (
              <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500 transform rotate-45" />
            )}
          </div>
          <p className={`text-xs truncate transition-colors ${isSelected ? "text-indigo-600/80 font-medium" : "text-slate-500"
            }`}>
            {chat.idea?.title}
          </p>

          {/* Rating Buttons - Thumbs Up/Down */}
          {onRate && (
            <div className="flex items-center gap-1 mt-2">
              <motion.button
                onClick={(e) => { e.stopPropagation(); onRate(true); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 rounded-lg transition-all duration-200 ${currentRating === true
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-500"
                  }`}
                title="Thumbs up - Rate this investor positively"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                onClick={(e) => { e.stopPropagation(); onRate(false); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 rounded-lg transition-all duration-200 ${currentRating === false
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  }`}
                title="Thumbs down - Rate this investor negatively"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
              <span className="text-[10px] text-slate-400 ml-1">Rate investor</span>
            </div>
          )}
        </motion.div>
      )}
    </div>

    {!collapsed && (
      <motion.button
        onClick={onPin}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${chat.founder_pinned
          ? "opacity-0" // Hide default pin if already pinned (shown in header)
          : "opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          }`}
      >
        <Pin className="w-3.5 h-3.5" />
      </motion.button>
    )}
  </motion.div>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const FounderDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingIdea, setViewingIdea] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCountsRef = useRef<Map<string, number>>(new Map());
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Investment Recording State
  const [recordInvestmentModal, setRecordInvestmentModal] = useState<{
    open: boolean;
    idea: Idea | null;
    investorId?: string;
    investorName?: string;
    chatRequestId?: string;
  }>({ open: false, idea: null });
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [isRecordingInvestment, setIsRecordingInvestment] = useState(false);
  const [investmentRecords, setInvestmentRecords] = useState<Record<string, unknown>[]>([]);

  // Investor ratings state (thumbs up/down)
  const [investorRatings, setInvestorRatings] = useState<Record<string, boolean | null>>({});

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedChat(null);
        setViewingIdea(null);
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };

    const init = async () => {
      try {
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

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          setIsLoading(false);
          toast({
            title: "Error loading profile",
            description: "Please refresh the page",
            variant: "destructive"
          });
          return;
        }

        if (!profileData || profileData.user_type !== "founder") {
          navigate("/");
          return;
        }
        setProfile(profileData);

        try {
          await connectFirebase();
        } catch (e) {
          console.error("Firebase init:", e);
        }

        await fetchDashboardData(profileData.id);
      } catch (error) {
        console.error("Dashboard init error:", error);
        setIsLoading(false);
        toast({
          title: "Error loading dashboard",
          description: "Please refresh the page",
          variant: "destructive"
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    init();

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profile) return;
    const channels = [
      supabase.channel('ideas-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchIdeas(profile.id)),
      supabase.channel('requests-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, () => fetchChatRequests(profile.id))
    ];
    channels.forEach(c => c.subscribe());
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [profile]);

  // Initialize Firebase on mount
  useEffect(() => {
    connectFirebase()
      .then(() => {
        console.log("[FOUNDER] Firebase connected successfully");
        setFirebaseReady(true);
      })
      .catch(e => console.error("[FOUNDER] Firebase connection failed:", e));
  }, []);

  // Real-time subscription for unread message counts
  useEffect(() => {
    if (!profile || chatRequests.length === 0 || !firebaseReady) {
      console.log("[FOUNDER] Skipping subscription setup:", {
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

    console.log(`[FOUNDER] Setting up subscriptions for ${activeChats.length} active chats`);

    activeChats.forEach(req => {
      // Initialize previous count ONLY if it doesn't exist yet
      if (!previousCountsRef.current.has(req.id)) {
        previousCountsRef.current.set(req.id, req.unread_count || 0);
        console.log(`[FOUNDER] Initialized prevCount for chat ${req.id} to ${req.unread_count || 0}`);
      }

      const unsubscribe = subscribeToUnreadCount(req.id, profile.id, (count) => {
        const prevCount = previousCountsRef.current.get(req.id) || 0;

        console.log(`[FOUNDER] Unread count update for chat ${req.id}:`, {
          chatId: req.id,
          investorName: req.investor?.name,
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
          console.log(`[FOUNDER] State updated - chat ${req.id} now has unread_count: ${count}`);
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
            description: `${req.investor?.name || 'An investor'} sent you ${newMessages} new message${newMessages > 1 ? 's' : ''}`,
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
      console.log("[FOUNDER] Cleaning up subscriptions");
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [profile?.id, chatRequests.length, firebaseReady]);

  // Separate effect for notification logic that depends on selectedChat
  const selectedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat?.id]);

  const fetchDashboardData = async (userId: string) => {
    setIsLoading(true);
    try {
      await Promise.all([fetchIdeas(userId), fetchChatRequests(userId)]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIdeas = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("founder_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ideas:", error);
        return;
      }
      setIdeas(data || []);
    } catch (error) {
      console.error("Error in fetchIdeas:", error);
    }
  };

  const fetchChatRequests = async (userId: string) => {
    try {
      const { data: requests, error } = await supabase
        .from("chat_requests")
        .select(`*, investor:profiles!chat_requests_investor_id_fkey(id, name, avatar_url), idea:ideas!chat_requests_idea_id_fkey(title)`)
        .eq("founder_id", userId);

      if (error) {
        console.error("Error fetching chat requests:", error);
        return;
      }

      if (requests) {
        // Preserve existing unread counts during refresh
        const updatedRequests = requests.map(req => {
          const existing = chatRequests.find(r => r.id === req.id);
          return { ...req, unread_count: existing?.unread_count || 0 };
        });
        setChatRequests(updatedRequests);

        // Fetch initial unread counts (real-time subscription will handle updates)
        for (const req of updatedRequests) {
          try {
            const count = await getUnreadCount(req.id, userId);
            setChatRequests(prev => prev.map(p => p.id === req.id ? { ...p, unread_count: count } : p));
          } catch (e) {
            console.error("Error fetching unread count:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchChatRequests:", error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handlePinChat = async (e: React.MouseEvent, requestId: string, currentStatus: boolean) => {
    e.stopPropagation();
    setChatRequests(prev => prev.map(c => c.id === requestId ? { ...c, founder_pinned: !currentStatus } : c));
    await supabase.from("chat_requests").update({ founder_pinned: !currentStatus }).eq("id", requestId);
  };

  const handleChatRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    const status = action === "accepted" ? "communicating" : "rejected";
    await supabase.from("chat_requests").update({ status }).eq("id", requestId);
    toast({ title: action === "accepted" ? "Connection accepted" : "Request declined" });
    if (profile) fetchChatRequests(profile.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // ============================================================================
  // INVESTOR RATING (Thumbs Up/Down)
  // ============================================================================
  const handleRateInvestor = async (chatRequestId: string, investorId: string, rating: boolean) => {
    if (!profile) return;

    try {
      // Check if rating already exists
      const { data: existingRating } = await supabase
        .from("investor_ratings")
        .select("id, rating")
        .eq("investor_id", investorId)
        .eq("founder_id", profile.id)
        .eq("chat_request_id", chatRequestId)
        .single();

      if (existingRating) {
        // Update existing rating
        if (existingRating.rating === rating) {
          // Same rating clicked - remove it
          await supabase
            .from("investor_ratings")
            .delete()
            .eq("id", existingRating.id);

          setInvestorRatings(prev => ({ ...prev, [chatRequestId]: null }));
          toast({ title: "Rating removed" });
        } else {
          // Different rating - update it
          await supabase
            .from("investor_ratings")
            .update({ rating, updated_at: new Date().toISOString() })
            .eq("id", existingRating.id);

          setInvestorRatings(prev => ({ ...prev, [chatRequestId]: rating }));
          toast({ title: rating ? "👍 Rated positively!" : "👎 Rated negatively" });
        }
      } else {
        // Insert new rating
        await supabase
          .from("investor_ratings")
          .insert({
            investor_id: investorId,
            founder_id: profile.id,
            chat_request_id: chatRequestId,
            rating
          });

        setInvestorRatings(prev => ({ ...prev, [chatRequestId]: rating }));
        toast({ title: rating ? "👍 Rated positively!" : "👎 Rated negatively" });
      }
    } catch (error) {
      console.error("Rating error:", error);
      toast({ title: "Error", description: "Could not save rating", variant: "destructive" });
    }
  };

  // Fetch existing ratings
  const fetchInvestorRatings = async () => {
    if (!profile) return;

    try {
      const { data: ratings } = await supabase
        .from("investor_ratings")
        .select("chat_request_id, rating")
        .eq("founder_id", profile.id);

      if (ratings) {
        const ratingsMap: Record<string, boolean> = {};
        ratings.forEach((r: any) => {
          ratingsMap[r.chat_request_id] = r.rating;
        });
        setInvestorRatings(ratingsMap);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  // Fetch ratings when profile is loaded
  useEffect(() => {
    if (profile) {
      fetchInvestorRatings();
    }
  }, [profile?.id]);

  // ============================================================================
  // INVESTMENT RECORDING
  // ============================================================================
  const handleRecordInvestment = async () => {
    if (!recordInvestmentModal.idea || !profile) return;

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid investment amount", variant: "destructive" });
      return;
    }

    setIsRecordingInvestment(true);

    try {
      // First, try to insert into investment_records table (if it exists)
      const { error: recordError } = await supabase
        .from("investment_records")
        .insert({
          idea_id: recordInvestmentModal.idea.id,
          investor_id: recordInvestmentModal.investorId || profile.id,
          founder_id: profile.id,
          chat_request_id: recordInvestmentModal.chatRequestId || null,
          amount: amount,
          notes: investmentNotes || null,
          status: 'confirmed'
        });

      // If table doesn't exist yet, directly update the idea
      if (recordError && recordError.code === '42P01') {
        // Table doesn't exist, update directly
        const currentAmount = recordInvestmentModal.idea.investment_received || 0;
        const { error: updateError } = await supabase
          .from("ideas")
          .update({ investment_received: currentAmount + amount })
          .eq("id", recordInvestmentModal.idea.id);

        if (updateError) throw updateError;
      } else if (recordError) {
        throw recordError;
      }
      // If no error, the trigger will auto-update investment_received

      toast({
        title: "Investment Recorded! 💰",
        description: `Successfully recorded $${amount.toLocaleString()} investment`
      });

      // Refresh data
      if (profile) await fetchIdeas(profile.id);

      // Reset modal
      setRecordInvestmentModal({ open: false, idea: null });
      setInvestmentAmount("");
      setInvestmentNotes("");

    } catch (error: unknown) {
      const err = error as Error;
      console.error("Investment recording error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to record investment",
        variant: "destructive"
      });
    } finally {
      setIsRecordingInvestment(false);
    }
  };

  const openRecordInvestmentModal = (idea: Idea, chatRequest?: ChatRequest) => {
    setRecordInvestmentModal({
      open: true,
      idea,
      investorId: chatRequest?.investor?.id,
      investorName: chatRequest?.investor?.name,
      chatRequestId: chatRequest?.id
    });
  };

  // ============================================================================
  // DERIVED DATA
  // ============================================================================
  const activeConnections = chatRequests
    .filter(c => ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(c.status))
    .filter(c =>
      (c.investor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.idea?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.founder_pinned === a.founder_pinned ? 0 : b.founder_pinned ? 1 : -1));

  const pendingRequests = chatRequests.filter(c => c.status === "pending");
  const totalRaised = ideas.reduce((acc, c) => acc + (c.investment_received || 0), 0);
  const fundedVentures = ideas.filter(i => i.status === "funded" || i.status === "deal_done").length;

  const filteredIdeas = ideas.filter(idea => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return idea.status === "pending" || idea.status === "in_progress";
    if (activeTab === "funded") return idea.status === "funded" || idea.status === "deal_done";
    return true;
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    return (
      <AnimatedGridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm text-slate-500 font-medium">Loading dashboard...</p>
          </motion.div>
        </div>
      </AnimatedGridBackground>
    );
  }

  // Show empty state if profile failed to load
  if (!profile) {
    return (
      <AnimatedGridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Unable to load profile</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </AnimatedGridBackground>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <AnimatedGridBackground>
      <div className="min-h-screen flex flex-col h-screen overflow-hidden">

        {/* ================================================================== */}
        {/* TOP NAVIGATION */}
        {/* ================================================================== */}
        <motion.header
          className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shrink-0 relative z-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">INNOVESTOR</h1>
                <p className="text-xs text-slate-500 font-medium">Founder Portal</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              {profile?.is_approved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </motion.div>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-slate-600 hover:text-slate-900">
                <User className="w-4 h-4 mr-2" /> Profile
              </Button>
              <div className="w-px h-6 bg-slate-200" />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                <LogOut className="w-4 h-4" />
              </Button>
              <Avatar className="w-10 h-10 border-2 border-white ring-2 ring-indigo-500/20 shadow-md cursor-pointer hover:ring-indigo-500 transition-all duration-300">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold text-lg">
                  {profile?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </motion.header>

        {/* ================================================================== */}
        {/* MAIN CONTENT AREA */}
        {/* ================================================================== */}
        <div className="flex-1 flex overflow-hidden">

          {/* ============================================================== */}
          {/* LEFT SIDEBAR - Connections */}
          {/* ============================================================== */}
          <motion.aside
            className="bg-white/70 backdrop-blur-md border-r border-slate-200/80 flex flex-col shrink-0 relative z-10"
            initial={{ width: 320 }}
            animate={{ width: isSidebarOpen ? 320 : 80 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
          >
            <div className={`p-4 border-b border-slate-100 ${!isSidebarOpen && "flex justify-center"}`}>
              <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} mb-3`}>
                {isSidebarOpen && (
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider whitespace-nowrap">
                      Connections
                    </h2>
                    {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/50"
                      >
                        {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0)}
                      </motion.span>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-slate-200 rounded-full"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>

              {isSidebarOpen && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 bg-slate-50/80 border-slate-200 text-sm focus-visible:ring-slate-300"
                  />
                </div>
              )}

              {isSidebarOpen && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={messageFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMessageFilter("all")}
                    className="flex-1 h-7 text-xs rounded-lg"
                  >
                    All
                  </Button>
                  <Button
                    variant={messageFilter === "unread" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMessageFilter("unread")}
                    className="flex-1 h-7 text-xs rounded-lg"
                  >
                    Unread
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="h-7 w-7 rounded-lg"
                    title={soundEnabled ? "Mute" : "Unmute"}
                  >
                    {soundEnabled ? (
                      <Activity className="w-3 h-3 text-green-600" />
                    ) : (
                      <Activity className="w-3 h-3 text-slate-400" />
                    )}
                  </Button>
                </div>
              )}

              {isSidebarOpen && chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setChatRequests(prev => prev.map(r => ({ ...r, unread_count: 0 })));
                    toast({ title: "All messages marked as read", duration: 2000 });
                  }}
                  className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1">
              <motion.div
                className="p-2 space-y-1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeConnections.length > 0 ? (
                  activeConnections
                    .filter(chat => messageFilter === "all" || (messageFilter === "unread" && chat.unread_count && chat.unread_count > 0))
                    .map((chat) => (
                      <motion.div key={chat.id} variants={itemVariants}>
                        <ConnectionItem
                          chat={chat}
                          isSelected={selectedChat?.id === chat.id}
                          onSelect={() => setSelectedChat(chat)}
                          onPin={(e) => handlePinChat(e, chat.id, !!chat.founder_pinned)}
                          onRate={(rating) => handleRateInvestor(chat.id, chat.investor_id!, rating)}
                          currentRating={investorRatings[chat.id]}
                          collapsed={!isSidebarOpen}
                        />
                      </motion.div>
                    ))
                ) : (
                  <motion.div
                    className="text-center py-12 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    {isSidebarOpen && (
                      <>
                        <p className="text-sm text-slate-500 font-medium">No active connections</p>
                        <p className="text-xs text-slate-400 mt-1">Investors will appear here</p>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </ScrollArea>

            {/* Pending Requests */}
            {isSidebarOpen && (
              <AnimatePresence>
                {pendingRequests.length > 0 && (
                  <motion.div
                    className="border-t border-slate-200 bg-slate-900 p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">
                        New Requests ({pendingRequests.length})
                      </span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pendingRequests.slice(0, 3).map((req) => (
                        <motion.div
                          key={req.id}
                          className="bg-white/10 backdrop-blur rounded-lg p-3"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.15 }}
                        >
                          <p className="text-sm font-semibold text-white truncate">{req.investor?.name}</p>
                          <p className="text-xs text-white/60 truncate mb-2">{req.idea?.title}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleChatRequestAction(req.id, "accepted")}
                              className="flex-1 h-7 text-xs bg-white text-slate-900 hover:bg-slate-100"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleChatRequestAction(req.id, "rejected")}
                              className="flex-1 h-7 text-xs text-white/80 hover:text-white hover:bg-white/10"
                            >
                              Decline
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.aside>

          {/* ============================================================== */}
          {/* MAIN CONTENT */}
          {/* ============================================================== */}
          <main className={`flex-1 overflow-y-auto transition-all duration-300 ${selectedChat ? "mr-96" : ""}`}>
            <motion.div
              className="max-w-6xl mx-auto p-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >

              {/* Page Header */}
              <motion.div
                className="flex items-end justify-between mb-8"
                variants={itemVariants}
              >
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Welcome back, {profile?.name?.split(" ")[0]}
                  </h1>
                  <p className="text-slate-500 mt-1">Here's an overview of your venture portfolio</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      if (!profile?.is_approved) {
                        toast({ title: "Verification Required", description: "Your profile must be verified first.", variant: "destructive" });
                        return;
                      }
                      navigate("/payment");
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Venture
                  </Button>
                </motion.div>
              </motion.div>

              {/* Metrics Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                variants={containerVariants}
              >
                <MetricCard
                  title="Total Raised"
                  value={`$${totalRaised.toLocaleString()}`}
                  subtitle="Across all ventures"
                  icon={DollarSign}
                  accentColor="emerald"
                  trend={totalRaised > 0 ? { value: "+12%", positive: true } : undefined}
                  index={0}
                />
                <MetricCard
                  title="Active Ventures"
                  value={ideas.length}
                  subtitle="In your portfolio"
                  icon={Lightbulb}
                  accentColor="blue"
                  index={1}
                />
                <MetricCard
                  title="Funded Ventures"
                  value={fundedVentures}
                  subtitle="Successfully funded"
                  icon={Target}
                  accentColor="emerald"
                  index={2}
                />
                <MetricCard
                  title="Investor Network"
                  value={activeConnections.length}
                  subtitle="Active connections"
                  icon={Users}
                  accentColor="slate"
                  index={3}
                />
              </motion.div>

              {/* Analytics Charts Section */}
              <motion.div
                className="grid lg:grid-cols-3 gap-6 mb-8"
                variants={containerVariants}
              >
                {/* Funding Comparison Chart */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-2"
                >
                  <Card className="border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">Funding Overview</CardTitle>
                          <CardDescription className="text-xs text-slate-500">Target vs Raised per venture</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-300" />
                            <span className="text-slate-500 font-medium">Target</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-900" />
                            <span className="text-slate-500 font-medium">Raised</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {ideas.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart
                            data={ideas.slice(0, 5).map(idea => ({
                              name: idea.title.length > 15 ? idea.title.substring(0, 15) + '...' : idea.title,
                              target: idea.investment_needed,
                              raised: idea.investment_received || 0,
                              fullName: idea.title
                            }))}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            barGap={4}
                            barCategoryGap="20%"
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                              interval={0}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'white',
                                fontSize: '12px'
                              }}
                              formatter={(value: number, name: string) => [
                                `$${value.toLocaleString()}`,
                                name === 'target' ? 'Target' : 'Raised'
                              ]}
                              labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                            />
                            <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="target" />
                            <Bar dataKey="raised" fill="#0f172a" radius={[4, 4, 0, 0]} name="raised" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-slate-400 text-sm">
                          <div className="text-center">
                            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <p>No ventures to display</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Submission Status Chart - 3D Pie */}
                <motion.div variants={itemVariants}>
                  <Card className="border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-slate-900">Submission Status</CardTitle>
                      <CardDescription className="text-xs text-slate-500">Current status of your ventures</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {ideas.length > 0 ? (
                        <div className="flex flex-col items-center">
                          {/* 3D Pie Chart Container */}
                          <div
                            className="relative w-full h-[180px]"
                            style={{
                              perspective: '800px',
                              perspectiveOrigin: '50% 50%'
                            }}
                          >
                            {/* Shadow Layer - creates 3D depth effect */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                transform: 'rotateX(60deg) translateZ(-20px) translateY(10px)',
                                filter: 'blur(15px)',
                                opacity: 0.3
                              }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={(() => {
                                      const statusCounts: Record<string, number> = {
                                        "Deal Done": 0, "Funded": 0, "Approved": 0, "Under Review": 0, "Rejected": 0
                                      };
                                      ideas.forEach(idea => {
                                        if (idea.status === 'completed') statusCounts["Deal Done"]++;
                                        else if (idea.status === 'funded') statusCounts["Funded"]++;
                                        else if (idea.status === 'in_progress') statusCounts["Approved"]++;
                                        else if (idea.status === 'rejected') statusCounts["Rejected"]++;
                                        else statusCounts["Under Review"]++;
                                      });
                                      return Object.entries(statusCounts)
                                        .filter(([_, val]) => val > 0)
                                        .map(([name, value]) => ({ name, value }));
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    dataKey="value"
                                    isAnimationActive={false}
                                  >
                                    <Cell fill="#000" />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Main Pie - 3D tilted */}
                            <div
                              className="w-full h-full"
                              style={{
                                transform: 'rotateX(25deg)',
                                transformStyle: 'preserve-3d'
                              }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={(() => {
                                      const statusCounts: Record<string, number> = {
                                        "Deal Done": 0, "Funded": 0, "Approved": 0, "Under Review": 0, "Rejected": 0
                                      };
                                      ideas.forEach(idea => {
                                        if (idea.status === 'completed') statusCounts["Deal Done"]++;
                                        else if (idea.status === 'funded') statusCounts["Funded"]++;
                                        else if (idea.status === 'in_progress') statusCounts["Approved"]++;
                                        else if (idea.status === 'rejected') statusCounts["Rejected"]++;
                                        else statusCounts["Under Review"]++;
                                      });
                                      return Object.entries(statusCounts)
                                        .filter(([_, val]) => val > 0)
                                        .map(([name, value]) => ({ name, value }));
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {(() => {
                                      const statusCounts: Record<string, number> = {
                                        "Deal Done": 0, "Funded": 0, "Approved": 0, "Under Review": 0, "Rejected": 0
                                      };
                                      ideas.forEach(idea => {
                                        if (idea.status === 'completed') statusCounts["Deal Done"]++;
                                        else if (idea.status === 'funded') statusCounts["Funded"]++;
                                        else if (idea.status === 'in_progress') statusCounts["Approved"]++;
                                        else if (idea.status === 'rejected') statusCounts["Rejected"]++;
                                        else statusCounts["Under Review"]++;
                                      });
                                      const data = Object.entries(statusCounts)
                                        .filter(([_, val]) => val > 0)
                                        .map(([name, value]) => ({ name, value }));

                                      const COLORS: Record<string, string> = {
                                        "Deal Done": "#3b82f6", // blue-500
                                        "Funded": "#10b981",    // emerald-500
                                        "Approved": "#8b5cf6",  // violet-500
                                        "Under Review": "#f59e0b", // amber-500
                                        "Rejected": "#ef4444"   // red-500
                                      };

                                      return data.map((entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={COLORS[entry.name]}
                                          style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.15))' }}
                                        />
                                      ));
                                    })()}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 w-full px-2">
                            {[
                              { label: "Deal Done", color: "bg-blue-500" },
                              { label: "Funded", color: "bg-emerald-500" },
                              { label: "Approved", color: "bg-violet-500" },
                              { label: "Reviewing", color: "bg-amber-500" },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-sm`} />
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-slate-400 text-sm">
                          <div className="text-center">
                            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <p>No ventures to display</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Ventures Section */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm"
                variants={itemVariants}
              >
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Your Ventures</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Manage and track your startup portfolio</p>
                    </div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                      <TabsList className="bg-slate-100 p-1">
                        <TabsTrigger value="all" className="text-xs px-3 data-[state=active]:bg-white">All</TabsTrigger>
                        <TabsTrigger value="active" className="text-xs px-3 data-[state=active]:bg-white">Active</TabsTrigger>
                        <TabsTrigger value="funded" className="text-xs px-3 data-[state=active]:bg-white">Funded</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {filteredIdeas.length > 0 ? (
                        <motion.div
                          className="grid md:grid-cols-2 gap-4"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {filteredIdeas.map((idea, index) => (
                            <VentureCard
                              key={idea.id}
                              idea={idea}
                              onClick={() => setViewingIdea(idea)}
                              onRecordInvestment={() => openRecordInvestmentModal(idea)}
                              index={index}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          className="text-center py-16"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">No ventures yet</h3>
                          <p className="text-sm text-slate-500 mb-6">Launch your first venture to start connecting with investors</p>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button onClick={() => navigate("/payment")} className="bg-slate-900 hover:bg-slate-800">
                              <Plus className="w-4 h-4 mr-2" /> Launch Venture
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          </main>

          {/* ============================================================== */}
          {/* RIGHT PANEL - Chat */}
          {/* ============================================================== */}
          <AnimatePresence>
            {selectedChat && profile && (
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

        {/* ================================================================== */}
        {/* IDEA DETAIL MODAL */}
        {/* ================================================================== */}
        <AnimatePresence>
          {viewingIdea && (
            <Dialog open={!!viewingIdea} onOpenChange={() => setViewingIdea(null)}>
              <DialogContent className="max-w-2xl border-slate-200 bg-white/95 backdrop-blur-md">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 border-slate-200 text-slate-600">
                        {viewingIdea.domain}
                      </Badge>
                      <DialogTitle className="text-xl font-bold text-slate-900">
                        {viewingIdea.title}
                      </DialogTitle>
                    </div>
                  </div>
                </DialogHeader>
                <motion.div
                  className="space-y-6 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {viewingIdea.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      className="p-4 bg-white border border-slate-200 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Target</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${viewingIdea.investment_needed.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs text-emerald-600 uppercase font-semibold tracking-wider mb-1">Raised</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        ${viewingIdea.investment_received.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>

                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((viewingIdea.investment_received / viewingIdea.investment_needed) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    />
                  </div>

                  {viewingIdea.media_url && (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        variant="outline"
                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() => window.open(viewingIdea.media_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> View Pitch Deck
                      </Button>
                    </motion.div>
                  )}

                  {/* Record Investment Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() => {
                        setViewingIdea(null);
                        openRecordInvestmentModal(viewingIdea);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-2" /> Record Investment
                    </Button>
                  </motion.div>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ================================================================== */}
        {/* INVESTMENT RECORDING MODAL */}
        {/* ================================================================== */}
        <AnimatePresence>
          {recordInvestmentModal.open && recordInvestmentModal.idea && (
            <Dialog open={recordInvestmentModal.open} onOpenChange={(open) => !open && setRecordInvestmentModal({ open: false, idea: null })}>
              <DialogContent className="max-w-md border-slate-200 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    Record Investment
                  </DialogTitle>
                </DialogHeader>
                <motion.div
                  className="space-y-5 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Venture Info */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Venture</p>
                    <p className="text-sm font-semibold text-slate-900">{recordInvestmentModal.idea.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Target: ${recordInvestmentModal.idea.investment_needed.toLocaleString()}</span>
                      <span>Raised: ${(recordInvestmentModal.idea.investment_received || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Investor Info (if from a chat) */}
                  {recordInvestmentModal.investorName && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <Avatar className="w-8 h-8 border border-blue-200">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                          {recordInvestmentModal.investorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">From Investor</p>
                        <p className="text-sm font-semibold text-blue-900">{recordInvestmentModal.investorName}</p>
                      </div>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Investment Amount *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        placeholder="10,000"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        className="h-12 pl-8 bg-white border-slate-200 rounded-xl text-lg font-semibold"
                        min={1}
                      />
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Notes (Optional)</label>
                    <Input
                      placeholder="e.g., Seed round, Series A..."
                      value={investmentNotes}
                      onChange={(e) => setInvestmentNotes(e.target.value)}
                      className="h-11 bg-white border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Remaining Calculation */}
                  {investmentAmount && !isNaN(parseFloat(investmentAmount)) && (
                    <motion.div
                      className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600 font-medium">After this investment:</span>
                        <span className="font-bold text-emerald-700">
                          ${((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)) / recordInvestmentModal.idea.investment_needed * 100, 100)}%`
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-emerald-600 mt-1">
                        {Math.min(((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)) / recordInvestmentModal.idea.investment_needed * 100, 100).toFixed(1)}% of target
                      </p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-slate-200"
                      onClick={() => setRecordInvestmentModal({ open: false, idea: null })}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={handleRecordInvestment}
                      disabled={isRecordingInvestment || !investmentAmount}
                    >
                      {isRecordingInvestment ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Recording...
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </AnimatedGridBackground >
  );
};

export default FounderDashboard;

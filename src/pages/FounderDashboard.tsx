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
    ArrowUpRight, Building2, Users, Target, CheckCircle2, ChevronLeft,
    Activity, LucideIcon, ThumbsUp, ThumbsDown, Receipt, Share2, Store
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import ChatBox from "@/components/ChatBox";
// AnimatedGridBackground removed
import { getUnreadCount, connectFirebase, subscribeToUnreadCount, auth as firebaseAuth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { ProfileViewModal } from "@/components/ProfileViewModal";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WeeklyLogSheet } from "@/components/WeeklyLogSheet";
import { MobileNav } from "@/components/layout/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActivityTimerBadge } from "@/components/ActivityTimerBadge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

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
    total_active_seconds?: number;
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

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string | null;
    is_read: boolean;
    created_at: string;
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
        slate: "bg-brand-yellow/10 text-brand-charcoal",
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
                <Card className="rounded-2xl border-border/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-3 sm:p-6">
                        <div className="flex items-start justify-between mb-2 sm:mb-4">
                            <motion.div
                                className={`p-3 rounded-xl ${accentStyles[accentColor]}`}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Icon className="w-5 h-5" />
                            </motion.div>
                            {trend && (
                                <motion.div
                                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
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
                                className="text-xl sm:text-3xl font-black text-foreground tracking-tight"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                            >
                                {value}
                            </motion.p>
                            <p className="text-sm font-semibold text-muted-foreground mt-1">{title}</p>
                            {subtitle && <p className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</p>}
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
    onShare,
    index = 0
}: {
    idea: Idea;
    onClick: () => void;
    onRecordInvestment?: () => void;
    onShare?: () => void;
    index?: number;
}) => {
    const progressPercent = Math.min((idea.investment_received / idea.investment_needed) * 100, 100);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "funded": return { label: "Funded", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
            case "deal_done": return { label: "Completed", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
            case "in_progress": return { label: "Active", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
            default: return { label: status.replace("_", " "), className: "bg-secondary text-muted-foreground border-border" };
        }
    };

    const statusConfig = getStatusConfig(idea.status);

    return (
        <motion.div
            variants={itemVariants}
            initial="rest"
            whileHover="hover"
            animate="rest"
            className="cursor-pointer relative group h-full"
        >
            <motion.div
                variants={cardHoverVariants}
                className="bg-white border border-border/60 rounded-3xl p-6 hover:border-border transition-all duration-300 h-full flex flex-col text-slate-900"
                style={{
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)"
                }}
                whileHover={{
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)"
                }}
                onClick={onClick}
            >
                <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs font-semibold border-border text-muted-foreground bg-secondary/50 rounded-lg px-2 py-0.5">
                                {idea.domain}
                            </Badge>
                            <Badge variant="outline" className={`text-xs font-semibold rounded-lg px-2 py-0.5 border ${statusConfig.className}`}>
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-brand-yellow transition-colors truncate">
                            {idea.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare && onShare();
                            }}
                            className="p-2 text-muted-foreground/60 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-full transition-colors z-10"
                            title="Copy public link"
                        >
                            <Share2 className="w-4 h-4" />
                        </motion.button>
                        <motion.div
                            initial={{ x: 0 }}
                            whileHover={{ x: 3 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-brand-yellow transition-colors shrink-0" />
                        </motion.div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1 px-1">{idea.description}</p>

                <div className="space-y-4 mt-auto">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Funding Progress</span>
                        <motion.span
                            className="font-bold text-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                        >
                            {progressPercent.toFixed(0)}%
                        </motion.span>
                    </div>
                    <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-brand-yellow rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
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
}) => {
    /* ── Collapsed: compact avatar-only view ── */
    if (collapsed) {
        return (
            <motion.div
                onClick={onSelect}
                whileTap={{ scale: 0.9 }}
                className={`relative flex justify-center py-2 cursor-pointer rounded-xl transition-colors ${isSelected ? "bg-brand-yellow/15" : "hover:bg-slate-100"
                    }`}
                title={chat.investor?.name}
            >
                <div className="relative">
                    <Avatar className={`w-9 h-9 border-2 shadow-sm ${isSelected ? "border-brand-yellow ring-2 ring-brand-yellow/20" : "border-white"
                        }`}>
                        <AvatarImage src={chat.investor?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-yellow to-amber-400 text-brand-charcoal font-bold text-xs">
                            {chat.investor?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {chat.unread_count != null && chat.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10">
                            {chat.unread_count}
                        </span>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full z-10" />
                </div>
            </motion.div>
        );
    }

    /* ── Expanded: full card view ── */
    return (
        <motion.div
            onClick={onSelect}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            layout
            className={`group relative rounded-2xl cursor-pointer transition-all duration-300 p-4 mb-3 ${isSelected
                ? "bg-gradient-to-br from-brand-yellow/10 to-amber-50 border-2 border-brand-yellow/40 shadow-lg shadow-brand-yellow/10"
                : "bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar className={`w-11 h-11 border-2 shadow-sm shrink-0 transition-all duration-300 ${isSelected ? "border-brand-yellow ring-2 ring-brand-yellow/20" : "border-slate-100"
                        }`}>
                        <AvatarImage src={chat.investor?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-yellow to-amber-400 text-brand-charcoal font-bold text-sm">
                            {chat.investor?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {chat.unread_count != null && chat.unread_count > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-red-500/30 z-10 animate-pulse"
                        >
                            {chat.unread_count}
                        </motion.span>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm z-10" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-brand-charcoal" : "text-slate-700"}`}>
                            {chat.investor?.name}
                        </p>
                        {chat.founder_pinned && (
                            <Pin className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow transform rotate-45" />
                        )}
                    </div>
                    <p className={`text-xs truncate transition-colors ${isSelected ? "text-amber-600 font-medium" : "text-slate-400"
                        }`}>
                        {chat.idea?.title || "Product/General Inquiry"}
                    </p>

                    {/* Rating Buttons */}
                    {onRate && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                            <motion.button
                                onClick={(e) => { e.stopPropagation(); onRate(true); }}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${currentRating === true
                                    ? "bg-emerald-100 text-emerald-600 shadow-sm"
                                    : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                                    }`}
                                title="Rate positively"
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                                onClick={(e) => { e.stopPropagation(); onRate(false); }}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${currentRating === false
                                    ? "bg-red-100 text-red-600 shadow-sm"
                                    : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                    }`}
                                title="Rate negatively"
                            >
                                <ThumbsDown className="w-3.5 h-3.5" />
                            </motion.button>
                            <span className="text-[10px] text-slate-400 ml-0.5">Rate</span>
                        </div>
                    )}

                    {chat.status === "deal_done" && (
                        <Button
                            size="sm"
                            className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white h-9 text-xs font-bold rounded-lg shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/deal-center/${chat.id}`;
                            }}
                        >
                            View Deal Room <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    )}
                </div>
            </div>

            <motion.button
                onClick={onPin}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200 ${chat.founder_pinned
                    ? "opacity-0"
                    : "opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    }`}
            >
                <Pin className="w-3.5 h-3.5" />
            </motion.button>
        </motion.div>
    );
};


// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
const FounderDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingIdea, setViewingIdea] = useState<Idea | null>(null);
    const [loggingIdea, setLoggingIdea] = useState<Idea | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [chatWidth, setChatWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const previousCountsRef = useRef<Map<string, number>>(new Map());
    const unsubscribersRef = useRef<(() => void)[]>([]);
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [profileToView, setProfileToView] = useState<any | null>(null);

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
    // investmentRecords state removed

    // Investor ratings state (thumbs up/down)
    const [investorRatings, setInvestorRatings] = useState<Record<string, boolean | null>>({});

    useEffect(() => {
        if (isMobile) setIsSidebarOpen(false);
    }, [isMobile]);

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
        if (profile?.id) {
            console.log("[REALTIME] Starting subscriptions for:", profile.id);

            const chatChannel = supabase
                .channel(`chats-${profile.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'chat_requests',
                    filter: `founder_id=eq.${profile.id}`
                }, handleChatUpdate)
                .subscribe();

            const notifChannel = supabase
                .channel(`notifs-${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${profile.id}`
                }, (payload) => {
                    console.log('[REALTIME] New Notification Received:', payload.new);
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);

                    if (soundEnabled) {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfk77RiGwU7k9bx0H4qBSh+zPLaizsKGGS56+mnVRILSKHh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMK');
                        audio.volume = 0.2;
                        audio.play().catch(() => { });
                    }

                    toast({
                        title: newNotif.title,
                        description: newNotif.message,
                        className: "bg-blue-600 text-white border-none shadow-lg"
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(chatChannel);
                supabase.removeChannel(notifChannel);
            };
        }
    }, [profile?.id]);

    async function handleChatUpdate(payload: any) {
        if (payload.eventType === 'UPDATE') {
            setChatRequests((prev) =>
                prev.map((req) => req.id === payload.new.id ? { ...req, ...payload.new } : req)
            );
            if (selectedChat?.id === payload.new.id) {
                setSelectedChat((prev) => prev ? { ...prev, ...payload.new } : null);
            }
        } else if (payload.eventType === 'INSERT') {
            const { data } = await supabase
                .from('chat_requests')
                .select(`*, investor:profiles!chat_requests_investor_id_fkey(*), idea:ideas(*)`)
                .eq('id', payload.new.id)
                .single();

            if (data) {
                setChatRequests(prev => [data, ...prev]);
                toast({
                    title: "New Investor Interest!",
                    description: `${data.investor?.name} is interested in ${data.idea?.title}`,
                    className: "bg-brand-yellow text-brand-charcoal"
                });
            }
        }
    }

    useEffect(() => {
        if (!profile) return;

        const channels = [
            supabase.channel('ideas-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchIdeas(profile.id)),
            supabase.channel('requests-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, () => fetchChatRequests(profile.id)),
            supabase.channel('investment-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'investment_records' }, () => fetchIdeas(profile.id))
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
            return;
        }

        // Cleanup previous subscriptions
        unsubscribersRef.current.forEach(unsub => unsub());
        unsubscribersRef.current = [];

        const activeChats = chatRequests.filter(r =>
            ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)
        );

        activeChats.forEach(req => {
            if (!previousCountsRef.current.has(req.id)) {
                previousCountsRef.current.set(req.id, req.unread_count || 0);
            }

            // @ts-ignore - firebase types might be lagging
            const unsubscribe = subscribeToUnreadCount(req.id, profile.id, (count, lastMessage) => {
                const prevCount = previousCountsRef.current.get(req.id) || 0;

                setChatRequests(prev => {
                    return prev.map(p =>
                        p.id === req.id ? { ...p, unread_count: count } : p
                    );
                });

                if (count > prevCount && selectedChat?.id !== req.id) {
                    const newMessages = count - prevCount;
                    let toastVariant: "default" | "destructive" = "default";
                    let toastTitle = "💬 New Message";
                    let toastClass = "";
                    const content = lastMessage?.content || "";

                    const positiveKeywords = ["Investment", "Funded", "Sent", "✅", "💰"];
                    if (positiveKeywords.some(k => content.toLowerCase().includes(k.toLowerCase()))) {
                        toastTitle = "💰 Investment Received!";
                        toastClass = "bg-emerald-600 text-white border-emerald-700";
                    } else if (["Refund", "Request", "Update", "🚨"].some(k => content.toLowerCase().includes(k.toLowerCase()))) {
                        toastTitle = "🚨 Action Required";
                        toastClass = "bg-rose-600 text-white border-rose-700";
                        toastVariant = "destructive";
                    }

                    if (soundEnabled) {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfk77RiGwU7k9bx0H4qBSh+zPLaizsKGGS56+mnVRILSKHh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMK');
                        audio.volume = 0.3;
                        audio.play().catch(() => { });
                    }

                    // Refined notification description
                    let displayDescription = content;
                    const isUrl = content.match(/^https?:\/\//i) || content.includes("supabase.co");
                    const investorName = req.investor?.name || "An investor";

                    if (isUrl) {
                        if (toastTitle.includes("Investment")) {
                            displayDescription = `${investorName} shared an investment proof screenshot`;
                        } else {
                            displayDescription = `${investorName} shared an attachment`;
                        }
                    } else if (content) {
                        displayDescription = `${investorName}: ${content}`;
                    } else {
                        displayDescription = `${investorName} sent you ${newMessages} new message${newMessages > 1 ? 's' : ''}`;
                    }

                    toast({
                        title: toastTitle,
                        description: displayDescription,
                        duration: 5000,
                        className: `${toastClass} shadow-xl border-none`,
                        variant: toastVariant
                    });
                }

                previousCountsRef.current.set(req.id, count);
            });

            unsubscribersRef.current.push(unsubscribe);
        });

        return () => {
            unsubscribersRef.current.forEach(unsub => unsub());
            unsubscribersRef.current = [];
        };
    }, [profile?.id, chatRequests.length, firebaseReady]);

    const selectedChatIdRef = useRef<string | null>(null);
    useEffect(() => {
        selectedChatIdRef.current = selectedChat?.id || null;
    }, [selectedChat?.id]);

    const fetchDashboardData = async (userId: string) => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchIdeas(userId),
                fetchChatRequests(userId),
                fetchNotifications(userId)
            ]);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNotifications = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        try {
            await (supabase as any)
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!profile) return;
        try {
            await (supabase as any)
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", profile.id);

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
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
                const updatedRequests = requests.map(req => {
                    const existing = chatRequests.find(r => r.id === req.id);
                    return { ...req, unread_count: existing?.unread_count || 0 };
                });
                setChatRequests(updatedRequests);

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
        await (supabase as any).from("chat_requests").update({ founder_pinned: !currentStatus }).eq("id", requestId);
    };

    const handleChatRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
        const status = action === "accepted" ? "communicating" : "rejected";
        await supabase.from("chat_requests").update({ status }).eq("id", requestId);
        toast({ title: action === "accepted" ? "Connection accepted" : "Request declined" });
        if (profile) fetchChatRequests(profile.id);
    };

    const handleLogout = async () => {
        try {
            console.log("Logout requested: unsubscribing firebase listeners and signing out...");

            // 1) Unsubscribe realtime listeners to stop background updates
            try {
                unsubscribersRef.current.forEach(unsub => unsub());
                unsubscribersRef.current = [];
                console.log("Firebase listeners unsubscribed");
            } catch (e) {
                console.warn("Error while unsubscribing listeners:", e);
            }

            // 2) If there's no active Supabase session treat as already-signed-out (avoid API error)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn("No active Supabase session found — clearing UI state and navigating away.");

                // Best-effort: sign out Firebase anonymous user if present
                try {
                    if (firebaseAuth?.currentUser) {
                        await firebaseSignOut(firebaseAuth);
                        console.log("Firebase anonymous sign-out complete");
                    }
                } catch (e) {
                    console.warn("Firebase signOut failed (non-fatal):", e);
                }

                setProfile(null);
                toast({ title: "Signed out" });
                navigate("/");
                return;
            }

            // 3) Perform Supabase signOut when session exists
            const { error } = await supabase.auth.signOut();
            if (error) {
                // Treat "auth session missing" or equivalent as non-fatal (idempotent sign-out)
                const msg = (error && (error.message || "")).toLowerCase();
                if (msg.includes("missing") || msg.includes("no session") || msg.includes("not found")) {
                    console.warn("Supabase signOut returned missing-session — continuing to clear UI.", error);
                } else {
                    console.error("Supabase signOut error:", error);
                    toast({ title: "Logout failed", description: error.message, variant: "destructive" });
                    return;
                }
            }

            // 4) Sign out Firebase anonymous auth (best-effort)
            try {
                if (firebaseAuth?.currentUser) {
                    await firebaseSignOut(firebaseAuth);
                    console.log("Firebase anonymous sign-out complete (post-supabase)");
                }
            } catch (e) {
                console.warn("Firebase signOut failed (non-fatal):", e);
            }

            // 5) Clear UI state and navigate away
            setProfile(null);
            toast({ title: "Signed out" });
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            toast({ title: "Error logging out", variant: "destructive" });
        }
    };

    // ============================================================================
    // INVESTOR RATING (Thumbs Up/Down)
    // ============================================================================
    const handleRateInvestor = async (chatRequestId: string, investorId: string, rating: boolean) => {
        if (!profile) return;

        try {
            const { data: existingRating } = await (supabase as any)
                .from("investor_ratings")
                .select("id, rating")
                .eq("investor_id", investorId)
                .eq("founder_id", profile.id)
                .eq("chat_request_id", chatRequestId)
                .single();

            if (existingRating) {
                if (existingRating.rating === rating) {
                    await (supabase as any)
                        .from("investor_ratings")
                        .delete()
                        .eq("id", existingRating.id);

                    setInvestorRatings(prev => ({ ...prev, [chatRequestId]: null }));
                    toast({ title: "Rating removed" });
                } else {
                    await (supabase as any)
                        .from("investor_ratings")
                        .update({ rating, updated_at: new Date().toISOString() })
                        .eq("id", existingRating.id);

                    setInvestorRatings(prev => ({ ...prev, [chatRequestId]: rating }));
                    toast({ title: rating ? "👍 Rated positively!" : "👎 Rated negatively" });
                }
            } else {
                await (supabase as any)
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

    const fetchInvestorRatings = async () => {
        if (!profile) return;

        try {
            const { data: ratings } = await (supabase as any)
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
            const { error: recordError } = await (supabase as any)
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

            if (recordError && recordError.code === '42P01') {
                const currentAmount = recordInvestmentModal.idea.investment_received || 0;
                const { error: updateError } = await supabase
                    .from("ideas")
                    .update({ investment_received: currentAmount + amount })
                    .eq("id", recordInvestmentModal.idea.id);

                if (updateError) throw updateError;
            } else if (recordError) {
                throw recordError;
            }

            toast({
                title: "Investment Recorded! 🎉",
                description: `Successfully recorded $${amount.toLocaleString()} investment`
            });

            if (profile) await fetchIdeas(profile.id);

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

    const timerMultiplier = loggingIdea ? 1.5 : (selectedChat ? 1.25 : 1.0);

    // ============================================================================
    // LOADING STATE
    // ============================================================================
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.div
                        className="w-10 h-10 border-2 border-border border-t-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-sm text-muted-foreground font-medium">Loading dashboard...</p>
                </motion.div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Unable to load profile</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <div className="flex flex-col min-h-screen lg:h-screen bg-background overflow-hidden font-sans text-foreground">
            {/* HEADER */}
            <motion.header
                className="bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-6 py-4 shrink-0 relative z-20"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <span className="font-bold text-xl tracking-tight text-foreground hidden md:block">
                            INNOVESTOR
                        </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                            <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
                                <PopoverTrigger asChild>
                                    <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
                                        <Bell className="w-5 h-5" />
                                        {notifications.filter(n => !n.is_read).length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                                        )}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-2xl border-border rounded-2xl bg-white" align="end">
                                    <div className="p-4 border-b border-border/60 flex items-center justify-between bg-secondary/30">
                                        <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                                        {notifications.some(n => !n.is_read) && (
                                            <button onClick={markAllAsRead} className="text-[10px] font-bold text-brand-yellow hover:text-brand-charcoal uppercase tracking-wider">
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <ScrollArea className="h-[400px]">
                                        {notifications.length > 0 ? (
                                            <div className="divide-y divide-border/40">
                                                {notifications.map((n) => (
                                                    <div key={n.id} onClick={() => !n.is_read && markNotificationAsRead(n.id)}
                                                        className={`p-4 hover:bg-secondary/50 transition-colors cursor-pointer relative ${!n.is_read ? "bg-brand-yellow/5" : ""}`}>
                                                        {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-yellow" />}
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg shrink-0 ${n.type === 'view' ? "bg-blue-100 text-blue-600" : "bg-brand-yellow/20 text-brand-charcoal"}`}>
                                                                <Bell className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={`text-sm leading-tight mb-1 ${!n.is_read ? "font-bold text-foreground" : "text-muted-foreground font-medium"}`}>{n.title}</p>
                                                                <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">{n.message}</p>
                                                                <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
                                                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-3">
                                                    <Bell className="w-6 h-6 text-muted-foreground/50" />
                                                </div>
                                                <p className="text-sm text-foreground font-medium">No notifications yet</p>
                                                <p className="text-xs text-muted-foreground mt-1">We'll notify you when investors view your ideas</p>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                        {profile?.is_approved && (
                            <div className="hidden md:block">
                                <ActivityTimerBadge
                                    profileId={profile?.id}
                                    isApproved={profile?.is_approved}
                                />
                            </div>
                        )}
                        <div className="h-8 w-px bg-border/60 mx-2" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-3 hover:bg-secondary/50 p-1.5 rounded-xl transition-all">
                                    <Avatar className="h-9 w-9 ring-2 ring-brand-yellow/10 transition-all">
                                        <AvatarImage src={profile?.avatar_url} />
                                        <AvatarFallback className="bg-brand-yellow/20 text-brand-charcoal font-bold">{profile?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-bold text-foreground leading-none">{profile?.name}</p>
                                        <span className="text-xs text-muted-foreground">Founder Account</span>
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 rounded-2xl border-border bg-white/95 backdrop-blur-xl shadow-xl mr-4">
                                <div className="space-y-1">
                                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl" onClick={() => navigate("/profile")}>
                                        <User className="w-4 h-4 mr-2" /> Profile
                                    </Button>
                                    <div className="h-px bg-border my-1" />
                                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                                        onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" /> Logout
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <div className="lg:hidden">
                            <MobileNav
                                userType="founder"
                                userName={profile?.name}
                                onLogout={handleLogout}
                                onMessagesClick={() => setIsSidebarOpen(true)}
                            />
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR */}
                <motion.aside
                    className={`${isMobile ? "fixed left-0 top-[73px] bottom-0 z-30 shadow-2xl" : "relative"} bg-slate-50/80 border-r border-slate-100 flex flex-col shrink-0 h-full overflow-hidden`}
                    initial={{ width: 320 }}
                    animate={{ width: isMobile ? (isSidebarOpen ? "88vw" : 0) : (isSidebarOpen ? 320 : 80) }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className={`${isSidebarOpen ? 'p-4' : 'py-3 px-2'} border-b border-slate-100 ${!isSidebarOpen && "flex justify-center"}`}>
                        <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} ${isSidebarOpen ? 'mb-4' : 'mb-0'}`}>
                            {isSidebarOpen && (
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest whitespace-nowrap">Connections</h2>
                                    {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 0 && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-red-500/30">
                                            {chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0)}
                                        </motion.span>
                                    )}
                                </div>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full text-slate-400"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? "rotate-180" : ""}`} />
                            </Button>
                        </div>
                        {isSidebarOpen && (
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search connections..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand-yellow/40 transition-all rounded-xl text-sm placeholder:text-slate-400" />
                            </div>
                        )}
                        {isSidebarOpen && (
                            <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                <Button variant={messageFilter === "all" ? "default" : "ghost"} size="sm" onClick={() => setMessageFilter("all")}
                                    className={`flex-1 h-8 text-xs rounded-lg font-semibold ${messageFilter === 'all' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:bg-white/60'}`}>All</Button>
                                <Button variant={messageFilter === "unread" ? "default" : "ghost"} size="sm" onClick={() => setMessageFilter("unread")}
                                    className={`flex-1 h-8 text-xs rounded-lg font-semibold ${messageFilter === 'unread' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:bg-white/60'}`}>Unread</Button>
                                <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}
                                    className={`h-8 w-8 rounded-lg ${soundEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-white/60'}`}
                                    title={soundEnabled ? "Mute" : "Unmute"}>
                                    <Activity className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        )}
                        {isSidebarOpen && chatRequests.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 0 && (
                            <Button variant="ghost" size="sm"
                                onClick={() => { setChatRequests(prev => prev.map(r => ({ ...r, unread_count: 0 }))); toast({ title: "All messages marked as read", duration: 2000 }); }}
                                className="mt-3 w-full text-xs text-slate-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-lg h-8">
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="flex-1">
                        <motion.div className="p-3 space-y-1" variants={containerVariants} initial="hidden" animate="visible">
                            {activeConnections.length > 0 ? (
                                activeConnections
                                    .filter(chat => messageFilter === "all" || (messageFilter === "unread" && chat.unread_count && chat.unread_count > 0))
                                    .map((chat) => (
                                        <motion.div key={chat.id} variants={itemVariants}>
                                            <ConnectionItem chat={chat} isSelected={selectedChat?.id === chat.id} onSelect={() => setSelectedChat(chat)}
                                                onPin={(e) => handlePinChat(e, chat.id, !!chat.founder_pinned)}
                                                onRate={(rating) => handleRateInvestor(chat.id, chat.investor_id!, rating)}
                                                currentRating={investorRatings[chat.id]} collapsed={!isSidebarOpen} />
                                        </motion.div>
                                    ))
                            ) : (
                                <motion.div className="text-center py-12 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                    <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
                                    </div>
                                    {isSidebarOpen && (<>
                                        <p className="text-sm text-foreground font-medium">No active connections</p>
                                        <p className="text-xs text-muted-foreground mt-1">Investors will appear here</p>
                                    </>)}
                                </motion.div>
                            )}
                        </motion.div>
                    </ScrollArea>
                    {/* Pending Requests */}
                    {isSidebarOpen && (
                        <AnimatePresence>
                            {pendingRequests.length > 0 && (
                                <motion.div className="border-t border-brand-yellow/20 bg-gradient-to-r from-brand-yellow to-brand-charcoal p-4"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bell className="w-4 h-4 text-white" />
                                        <span className="text-sm font-bold text-white">New Requests ({pendingRequests.length})</span>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {pendingRequests.slice(0, 3).map((req) => (
                                            <motion.div key={req.id} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10"
                                                whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
                                                <p className="text-sm font-bold text-white truncate">{req.investor?.name}</p>
                                                <p className="text-xs text-white/70 truncate mb-3">{req.idea?.title}</p>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleChatRequestAction(req.id, "accepted")}
                                                        className="flex-1 h-7 text-xs bg-white text-brand-charcoal hover:bg-brand-yellow/20 border-0 font-bold">Accept</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleChatRequestAction(req.id, "rejected")}
                                                        className="flex-1 h-7 text-xs text-white/80 hover:text-white hover:bg-white/10">Decline</Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </motion.aside>

                {/* MAIN CONTENT */}
                <main className={`flex-1 overflow-y-auto bg-background transition-all duration-300 ${selectedChat ? "lg:mr-96" : ""}`}>
                    <motion.div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-8" variants={containerVariants} initial="hidden" animate="visible">
                        {/* Page Header */}
                        <motion.div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-8 gap-4" variants={itemVariants}>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                                    Welcome back, {profile?.name?.split(" ")[0]}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm sm:text-lg">Here's an overview of your venture portfolio</p>
                            </div>
                            <div className="flex items-center gap-3">

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button onClick={() => {
                                        if (!profile?.is_approved) { toast({ title: "Verification Required", description: "Your profile must be verified first.", variant: "destructive" }); return; }
                                        navigate("/payment");
                                    }} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal shadow-lg shadow-brand-yellow/20 rounded-xl h-11 px-6 font-bold">
                                        <Plus className="w-5 h-5 mr-2" /> New Venture
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Metrics Grid */}
                        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8" variants={containerVariants}>
                            <MetricCard title="Total Raised" value={`$${totalRaised.toLocaleString()}`} subtitle="Across all ventures" icon={DollarSign} accentColor="emerald"
                                trend={totalRaised > 0 ? { value: "+12%", positive: true } : undefined} index={0} />
                            <MetricCard title="Active Ventures" value={ideas.length} subtitle="In your portfolio" icon={Lightbulb} accentColor="blue" index={1} />
                            <MetricCard title="Funded Ventures" value={fundedVentures} subtitle="Successfully funded" icon={Target} accentColor="amber" index={2} />
                            <MetricCard title="Investor Network" value={activeConnections.length} subtitle="Active connections" icon={Users} accentColor="slate" index={3} />
                        </motion.div>

                        {/* Analytics Charts */}
                        <motion.div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8" variants={containerVariants}>
                            {/* Funding Overview Chart */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 h-full">
                                <div className="border border-border/60 bg-white rounded-3xl shadow-sm h-full overflow-hidden p-6 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">Funding Overview</h3>
                                            <p className="text-sm text-muted-foreground">Target vs Raised per venture</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#cbd5e1]" /><span className="text-muted-foreground">Target</span></div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#124E66]" /><span className="text-foreground">Raised</span></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[240px]">
                                        {ideas.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={ideas.slice(0, 5).map(idea => ({
                                                    name: idea.title.length > 15 ? idea.title.substring(0, 15) + '...' : idea.title,
                                                    target: idea.investment_needed,
                                                    raised: idea.investment_received || 0,
                                                    fullName: idea.title
                                                }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8} barCategoryGap="25%">
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} interval={0} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false}
                                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                                        tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`} dx={-10} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', fontSize: '12px' }}
                                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                                        labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                                    />
                                                    <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target" />
                                                    <Bar dataKey="raised" fill="#124E66" radius={[4, 4, 0, 0]} name="Raised" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                                <div className="text-center"><Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p>No ventures to display</p></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Submission Status Donut */}
                            <motion.div variants={itemVariants}>
                                <Card className="border border-border/60 bg-white shadow-sm h-full overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold text-foreground">Submission Status</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Current status of your ventures</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {ideas.length > 0 ? (() => {
                                            const statusCounts: Record<string, number> = { "Deal Done": 0, "Funded": 0, "Approved": 0, "Under Review": 0 };
                                            ideas.forEach(idea => {
                                                if (idea.status === 'completed') statusCounts["Deal Done"]++;
                                                else if (idea.status === 'funded') statusCounts["Funded"]++;
                                                else if (idea.status === 'in_progress') statusCounts["Approved"]++;
                                                else statusCounts["Under Review"]++;
                                            });
                                            const COLORS: Record<string, string> = { "Deal Done": "#3b82f6", "Funded": "#10b981", "Approved": "#8b5cf6", "Under Review": "#f59e0b" };
                                            const chartData = Object.entries(statusCounts).filter(([_, val]) => val > 0).map(([name, value]) => ({ name, value, color: COLORS[name] }));
                                            const totalVentures = ideas.length;
                                            return (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative w-full h-[200px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none"
                                                                    animationBegin={0} animationDuration={800}>
                                                                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))', cursor: 'pointer' }} />))}
                                                                </Pie>
                                                                <Tooltip content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const data = payload[0].payload;
                                                                        return (<div className="bg-brand-yellow text-brand-charcoal px-3 py-2 rounded-lg shadow-lg text-xs"><p className="font-semibold">{data.name}</p><p className="text-slate-700">{data.value} venture{data.value !== 1 ? 's' : ''}</p></div>);
                                                                    }
                                                                    return null;
                                                                }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                            <span className="text-3xl font-bold text-foreground">{totalVentures}</span>
                                                            <span className="text-xs text-muted-foreground font-medium">Ventures</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 w-full px-2">
                                                        {[
                                                            { label: "Deal Done", key: "Deal Done", color: "bg-blue-500" },
                                                            { label: "Funded", key: "Funded", color: "bg-emerald-500" },
                                                            { label: "Approved", key: "Approved", color: "bg-violet-500" },
                                                            { label: "Reviewing", key: "Under Review", color: "bg-amber-500" },
                                                        ].map((item) => (
                                                            <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/60">
                                                                <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm shrink-0`} />
                                                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{item.label}</span>
                                                                <span className="text-sm font-bold text-foreground ml-auto">{statusCounts[item.key]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
                                                <div className="text-center"><Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p>No ventures to display</p></div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>

                        {/* Ventures Section */}
                        <motion.div className="bg-white border border-border/60 rounded-3xl shadow-sm overflow-hidden" variants={itemVariants}>
                            <div className="p-4 sm:p-6 border-b border-border/60">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Your Ventures</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">Manage and track your startup portfolio</p>
                                    </div>
                                    <div className="bg-secondary/50 p-1 rounded-xl flex items-center">
                                        {["all", "active", "funded"].map((tab) => (
                                            <button key={tab} onClick={() => setActiveTab(tab)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}>
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                                        {filteredIdeas.length > 0 ? (
                                            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                                                {filteredIdeas.map((idea, index) => (
                                                    <VentureCard key={idea.id} idea={idea} index={index}
                                                        onClick={() => navigate(`/idea/${idea.id}`)}
                                                        onShare={() => {
                                                            const url = `${window.location.origin}/idea/${idea.id}`;
                                                            navigator.clipboard.writeText(url).then(() => {
                                                                toast({ title: "Link copied!", description: "Public link copied to clipboard." });
                                                            }).catch(() => {
                                                                toast({ title: "Copy failed", description: "Could not copy link.", variant: "destructive" });
                                                            });
                                                        }} />
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                                <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-foreground mb-2">No ventures yet</h3>
                                                <p className="text-sm text-muted-foreground mb-6">Launch your first venture to start connecting with investors</p>
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <Button onClick={() => navigate("/payment")} className="bg-indigo-600 hover:bg-indigo-700">
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

                {/* RIGHT CHAT PANEL */}
                <AnimatePresence>
                    {selectedChat && profile && (
                        <>
                            {isResizing && !isMobile && (
                                <div className="fixed inset-0 z-50 cursor-ew-resize"
                                    onMouseMove={(e) => { const newWidth = window.innerWidth - e.clientX; if (newWidth > 300 && newWidth < 800) setChatWidth(newWidth); }}
                                    onMouseUp={() => setIsResizing(false)} onMouseLeave={() => setIsResizing(false)} />
                            )}
                            <motion.aside initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{ width: isMobile ? "100vw" : chatWidth }}
                                className={`fixed right-0 ${isMobile ? "top-0" : "top-[73px]"} bottom-0 w-full md:w-auto bg-background/95 backdrop-blur-md border-l border-border shadow-2xl z-40 flex`}>
                                <div className="hidden md:flex w-1.5 h-full cursor-ew-resize hover:bg-indigo-500/50 transition-colors items-center justify-center group"
                                    onMouseDown={(e) => { if (isMobile) return; e.preventDefault(); setIsResizing(true); }}>
                                    <div className="w-0.5 h-8 bg-border group-hover:bg-indigo-500 rounded-full" />
                                </div>
                                <div className="flex-1 h-full min-w-0">
                                    <ChatBox chatRequest={selectedChat} currentUserId={profile.id} onClose={() => setSelectedChat(null)}
                                        onMessagesRead={() => { setChatRequests(prev => prev.map(x => x.id === selectedChat.id ? { ...x, unread_count: 0 } : x)); }}
                                        onViewProfile={async () => {
                                            if (!selectedChat.investor_id) return;
                                            const { data } = await supabase.from('profiles').select('*').eq('id', selectedChat.investor_id).single();
                                            if (data) setProfileToView(data);
                                        }}
                                        variant="embedded" className="h-full" />
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* IDEA DETAIL MODAL */}
            <AnimatePresence>
                {viewingIdea && (
                    <>
                        <WeeklyLogSheet idea={loggingIdea} open={!!loggingIdea} onOpenChange={(open) => !open && setLoggingIdea(null)} />
                        <Dialog open={!!viewingIdea} onOpenChange={() => setViewingIdea(null)}>
                            <DialogContent className="max-w-2xl border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                                <DialogHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Badge variant="outline" className="mb-2 border-border text-muted-foreground">{viewingIdea.domain}</Badge>
                                            <DialogTitle className="text-2xl font-bold text-foreground">{viewingIdea.title}</DialogTitle>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <motion.div className="space-y-6 pt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                    <div className="p-5 bg-white rounded-2xl border border-border/60">
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewingIdea.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.div className="p-5 bg-white border border-border/60 rounded-2xl" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Target</p>
                                            <p className="text-3xl font-black text-foreground">${viewingIdea.investment_needed.toLocaleString()}</p>
                                        </motion.div>
                                        <motion.div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                                            <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Raised</p>
                                            <p className="text-3xl font-black text-emerald-600">${viewingIdea.investment_received.toLocaleString()}</p>
                                        </motion.div>
                                    </div>
                                    <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                                        <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                            initial={{ width: 0 }} animate={{ width: `${Math.min((viewingIdea.investment_received / viewingIdea.investment_needed) * 100, 100)}%` }}
                                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} />
                                    </div>
                                    {viewingIdea.media_url && (
                                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                            <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary h-12 rounded-xl"
                                                onClick={() => window.open(viewingIdea.media_url, '_blank')}>
                                                <ExternalLink className="w-4 h-4 mr-2" /> View Pitch Deck
                                            </Button>
                                        </motion.div>
                                    )}
                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold"
                                            onClick={() => { setViewingIdea(null); openRecordInvestmentModal(viewingIdea); }}>
                                            <DollarSign className="w-4 h-4 mr-2" /> Record Investment
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </AnimatePresence>

            {/* INVESTMENT RECORDING MODAL */}
            <AnimatePresence>
                {recordInvestmentModal.open && recordInvestmentModal.idea && (
                    <Dialog open={recordInvestmentModal.open} onOpenChange={(open) => !open && setRecordInvestmentModal({ open: false, idea: null })}>
                        <DialogContent className="max-w-md border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    Record Investment
                                </DialogTitle>
                            </DialogHeader>
                            <motion.div className="space-y-5 pt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <div className="p-4 bg-white rounded-xl border border-border/60">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Venture</p>
                                    <p className="text-sm font-bold text-foreground">{recordInvestmentModal.idea.title}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Target: ${recordInvestmentModal.idea.investment_needed.toLocaleString()}</span>
                                        <span>Raised: ${(recordInvestmentModal.idea.investment_received || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                {recordInvestmentModal.investorName && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <Avatar className="w-8 h-8 border border-blue-500/20">
                                            <AvatarFallback className="bg-blue-500/20 text-blue-600 text-xs font-bold">{recordInvestmentModal.investorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold">From Investor</p>
                                            <p className="text-sm font-bold text-blue-900">{recordInvestmentModal.investorName}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Investment Amount *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                                        <Input type="number" placeholder="10,000" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)}
                                            className="h-12 pl-8 bg-white border-border rounded-xl text-lg font-bold placeholder:font-normal" min={1} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Notes (Optional)</label>
                                    <Input placeholder="e.g., Seed round, Series A..." value={investmentNotes} onChange={(e) => setInvestmentNotes(e.target.value)}
                                        className="h-11 bg-white border-border rounded-xl" />
                                </div>
                                {investmentAmount && !isNaN(parseFloat(investmentAmount)) && (
                                    <motion.div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-emerald-600 font-medium">After this investment:</span>
                                            <span className="font-bold text-emerald-700">${((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)).toLocaleString()}</span>
                                        </div>
                                        <div className="mt-2 h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)) / recordInvestmentModal.idea.investment_needed * 100, 100)}%` }}
                                                transition={{ duration: 0.5 }} />
                                        </div>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            {Math.min(((recordInvestmentModal.idea.investment_received || 0) + parseFloat(investmentAmount)) / recordInvestmentModal.idea.investment_needed * 100, 100).toFixed(1)}% of target
                                        </p>
                                    </motion.div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1 h-11 border-border hover:bg-secondary rounded-xl"
                                        onClick={() => setRecordInvestmentModal({ open: false, idea: null })}>Cancel</Button>
                                    <Button className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                                        onClick={handleRecordInvestment} disabled={isRecordingInvestment || !investmentAmount}>
                                        {isRecordingInvestment ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Recording...
                                            </div>
                                        ) : (<><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm</>)}
                                    </Button>
                                </div>
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            <ProfileViewModal isOpen={!!profileToView} onClose={() => setProfileToView(null)} profile={profileToView} />
        </div>
    );
};

export default FounderDashboard;

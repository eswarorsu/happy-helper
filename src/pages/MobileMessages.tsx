import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Bell, ArrowRight, MessageSquare } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
import { supabase } from "@/integrations/supabase/client";

interface ChatRequest {
    id: string;
    status: string;
    created_at: string;
    investor: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
    founder: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
    idea: {
        title: string;
    } | null;
}

const MobileMessages = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"All" | "Unread">("All");
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState<"founder" | "investor">("founder");
    const [currentProfile, setCurrentProfile] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate("/auth"); return; }

            const { data: profile } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, user_type")
                .eq("user_id", user.id)
                .single();

            if (!profile) { setLoading(false); return; }
            
            setCurrentProfile(profile);
            const resolvedType = (profile as any).user_type as "founder" | "investor";
            setUserType(resolvedType);

            const query = supabase
                .from("chat_requests")
                .select(`
                    id, status, created_at,
                    investor:profiles!chat_requests_investor_id_fkey(id, name, avatar_url),
                    founder:profiles!chat_requests_founder_id_fkey(id, name, avatar_url),
                    idea:ideas!chat_requests_idea_id_fkey(title)
                `)
                .order("created_at", { ascending: false });

            if (resolvedType === "founder") {
                query.eq("founder_id", profile.id);
            } else {
                query.eq("investor_id", profile.id);
            }

            const { data: requests } = await query;
            setChatRequests((requests as any) ?? []);
            setLoading(false);
        };

        fetchData();
    }, [navigate]);

    const filteredChats = chatRequests.filter(chat => {
        const otherParty = userType === "founder" ? chat.investor : chat.founder;
        const name = otherParty?.name?.toLowerCase() ?? "";
        const ideaTitle = chat.idea?.title?.toLowerCase() ?? "";
        const q = searchQuery.toLowerCase();
        return name.includes(q) || ideaTitle.includes(q);
    });

    const getOtherParty = (chat: ChatRequest) => userType === "founder" ? chat.investor : chat.founder;

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col font-sans pb-24">
            {/* Sticky Header */}
            <div className="bg-[#FDFCF8] px-4 py-3 flex items-center justify-between sticky top-0 z-20 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-yellow flex items-center justify-center shrink-0">
                        <span className="font-bold text-black text-[10px]">in</span>
                    </div>
                    <span className="font-black text-base tracking-tight text-black">INNOVESTOR</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600 hover:text-black transition-colors">
                        <Bell className="w-4.5 h-4.5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden border border-orange-200 shrink-0">
                        {currentProfile?.avatar_url ? (
                            <img src={currentProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-orange-600">
                                {currentProfile?.name?.charAt(0)?.toUpperCase() ?? "U"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 pt-3 pb-4">
                {/* Active tab + All/Unread toggle */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active</h2>
                    <div className="flex bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                        <button
                            onClick={() => setActiveTab("All")}
                            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${activeTab === "All" ? "bg-black text-white" : "text-slate-500"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab("Unread")}
                            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${activeTab === "Unread" ? "bg-black text-white" : "text-slate-500"}`}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                {/* Title & Close */}
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-bold text-black tracking-tight">Messages</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={userType === "founder" ? "Search investors..." : "Search founders..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F5F5F3] hover:bg-[#F0F0ED] transition-colors border-0 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow focus:outline-none"
                    />
                </div>

                {/* Chat List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 rounded-full border-2 border-brand-yellow border-t-transparent animate-spin" />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <MessageSquare className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No messages yet</p>
                        <p className="text-xs text-slate-400 mt-1">Your deal conversations will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredChats.map((chat) => {
                            const other = getOtherParty(chat);
                            const statusColor = chat.status === "accepted" ? "bg-emerald-500" : 
                                                chat.status === "pending" ? "bg-amber-400" : "bg-slate-400";

                            return (
                                <div key={chat.id} className="bg-white rounded-2xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                                                {other?.avatar_url ? (
                                                    <img src={other.avatar_url} alt={other.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                                                        {other?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-white`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 text-sm truncate">{other?.name ?? "Unknown"}</h3>
                                            <p className="text-slate-500 text-xs truncate">{chat.idea?.title ?? "Untitled idea"}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            chat.status === "accepted" ? "bg-emerald-50 text-emerald-700" :
                                            chat.status === "pending" ? "bg-amber-50 text-amber-700" :
                                            "bg-slate-100 text-slate-600"
                                        }`}>
                                            {chat.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/deal-center/${chat.id}`)}
                                        className="w-full py-2.5 bg-brand-charcoal hover:bg-black text-brand-yellow rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        View Deal Room
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <MobileNav userType={userType} />
        </div>
    );
};

export default MobileMessages;

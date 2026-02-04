import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Rocket, Search, ArrowLeft, Filter, MapPin, Briefcase, Clock,
    DollarSign, TrendingUp, Users, Sparkles, ChevronDown, X, Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedGridBackground from "@/components/AnimatedGridBackground";

// Types
interface Idea {
    id: string;
    title: string;
    description: string;
    domain: string;
    investment_needed: number;
    investment_received: number;
    status: string;
    created_at: string;
    founder_city?: string;
    work_mode?: string;
    team_size?: string;
    traction?: string;
}

interface Profile {
    id: string;
    name: string;
    user_type: string;
    is_approved?: boolean;
}

// Constants
const DOMAINS = [
    "FinTech", "HealthTech", "EdTech", "AI/ML", "SaaS", "E-commerce",
    "CleanTech", "AgriTech", "PropTech", "Gaming", "Social Media", "Logistics", "Other"
];

const TRACTION_OPTIONS = ["Idea Stage", "Prototype/MVP", "Early Adopters", "Generating Revenue"];
const TEAM_SIZE_OPTIONS = ["Solo Founder", "2-5 People", "5-10 People", "10+ People"];

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

// Helper: Time ago
const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const isNewIdea = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 7;
};

const Marketplace = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(true);
    const [chatRequests, setChatRequests] = useState<Record<string, string>>({});

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [investmentRange, setInvestmentRange] = useState([0, 1000000]);
    const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedTraction, setSelectedTraction] = useState<string>("");
    const [selectedTeamSize, setSelectedTeamSize] = useState<string>("");
    const [sortBy, setSortBy] = useState<"newest" | "funding" | "investment">("newest");

    // Fetch Data
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

            if (!profileData || profileData.user_type !== "investor") {
                navigate("/");
                return;
            }

            setProfile(profileData);

            // Fetch approved ideas - using valid status values from DB constraint
            // 'pending' = awaiting admin, show all others
            const { data: ideasData, error: ideasError } = await supabase
                .from("ideas")
                .select("*")
                .neq("status", "pending")
                .order("created_at", { ascending: false });

            if (ideasError) {
                console.error("Ideas fetch error:", ideasError);
            }
            console.log("Fetched ideas:", ideasData?.length || 0);

            setIdeas(ideasData || []);

            // Fetch existing chat requests
            const { data: requestsData } = await supabase
                .from("chat_requests")
                .select("idea_id, status")
                .eq("investor_id", profileData.id);

            if (requestsData) {
                const requestsMap: Record<string, string> = {};
                requestsData.forEach(r => {
                    requestsMap[r.idea_id] = r.status;
                });
                setChatRequests(requestsMap);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [navigate]);

    // Filter Logic
    const filteredIdeas = ideas.filter(idea => {
        // Search
        if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !idea.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !idea.domain.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Domain
        if (selectedDomains.length > 0 && !selectedDomains.includes(idea.domain)) {
            return false;
        }

        // Investment Range
        if (idea.investment_needed < investmentRange[0] || idea.investment_needed > investmentRange[1]) {
            return false;
        }

        // Work Mode
        if (selectedWorkModes.length > 0 && idea.work_mode && !selectedWorkModes.includes(idea.work_mode)) {
            return false;
        }

        // Location
        if (locationSearch && idea.founder_city &&
            !idea.founder_city.toLowerCase().includes(locationSearch.toLowerCase())) {
            return false;
        }

        // Traction
        if (selectedTraction && selectedTraction !== "all" && idea.traction !== selectedTraction) {
            return false;
        }

        // Team Size
        if (selectedTeamSize && selectedTeamSize !== "all" && idea.team_size !== selectedTeamSize) {
            return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "funding") {
            const aProgress = (a.investment_received || 0) / a.investment_needed;
            const bProgress = (b.investment_received || 0) / b.investment_needed;
            return bProgress - aProgress;
        }
        if (sortBy === "investment") {
            return b.investment_needed - a.investment_needed;
        }
        return 0;
    });

    // Toggle Domain
    const toggleDomain = (domain: string) => {
        setSelectedDomains(prev =>
            prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
        );
    };

    // Toggle Work Mode
    const toggleWorkMode = (mode: string) => {
        setSelectedWorkModes(prev =>
            prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
        );
    };

    // Clear Filters
    const clearFilters = () => {
        setSearchQuery("");
        setSelectedDomains([]);
        setInvestmentRange([0, 1000000]);
        setSelectedWorkModes([]);
        setLocationSearch("");
        setSelectedTraction("");
        setSelectedTeamSize("");
        setSortBy("newest");
    };

    // Request Connection
    const handleRequestConnection = async (idea: Idea) => {
        if (!profile) return;

        if (!profile.is_approved) {
            toast({ title: "Verification Required", description: "Wait for admin verification.", variant: "destructive" });
            return;
        }

        const existingStatus = chatRequests[idea.id];
        if (existingStatus) {
            if (["accepted", "communicating", "deal_done"].includes(existingStatus)) {
                navigate("/investor-dashboard");
            } else {
                toast({ title: "Request pending", description: "Waiting for founder's approval" });
            }
            return;
        }

        // Get founder_id for this idea
        const { data: ideaDetails } = await supabase
            .from("ideas")
            .select("founder_id")
            .eq("id", idea.id)
            .single();

        if (!ideaDetails) {
            toast({ title: "Error", description: "Could not find idea details", variant: "destructive" });
            return;
        }

        const { error } = await supabase
            .from("chat_requests")
            .insert({
                idea_id: idea.id,
                investor_id: profile.id,
                founder_id: ideaDetails.founder_id,
                status: "pending"
            });

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Request sent!", description: "Waiting for founder's approval" });
            setChatRequests(prev => ({ ...prev, [idea.id]: "pending" }));
        }
    };

    // Active filter count
    const activeFilterCount = [
        selectedDomains.length > 0,
        investmentRange[0] > 0 || investmentRange[1] < 1000000,
        selectedWorkModes.length > 0,
        locationSearch !== "",
        selectedTraction !== "",
        selectedTeamSize !== ""
    ].filter(Boolean).length;

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
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/investor-dashboard")}
                                className="text-slate-500"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900">Marketplace</h1>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        {filteredIdeas.length} ideas available
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search ideas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-64 h-10 bg-slate-50 border-slate-200"
                                />
                            </div>
                            <Button
                                variant={showFilters ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="bg-white text-indigo-600 ml-1">{activeFilterCount}</Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex gap-6">
                        {/* Filter Sidebar */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.aside
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 280, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="shrink-0"
                                >
                                    <Card className="sticky top-24 bg-white border-slate-200 shadow-sm">
                                        <CardHeader className="pb-3 border-b border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm font-bold">Filters</CardTitle>
                                                {activeFilterCount > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={clearFilters}
                                                        className="text-xs text-slate-500 h-7"
                                                    >
                                                        Clear all
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <ScrollArea className="h-[calc(100vh-220px)]">
                                            <CardContent className="pt-4 space-y-6">
                                                {/* Sort By */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Sort By
                                                    </label>
                                                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="newest">Newest First</SelectItem>
                                                            <SelectItem value="funding">Funding Progress</SelectItem>
                                                            <SelectItem value="investment">Investment Needed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Domain */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Domain
                                                    </label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {DOMAINS.slice(0, 8).map(domain => (
                                                            <Badge
                                                                key={domain}
                                                                variant={selectedDomains.includes(domain) ? "default" : "outline"}
                                                                className={`cursor-pointer text-[10px] py-0.5 ${selectedDomains.includes(domain)
                                                                    ? "bg-indigo-600"
                                                                    : "hover:bg-slate-100"
                                                                    }`}
                                                                onClick={() => toggleDomain(domain)}
                                                            >
                                                                {domain}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Investment Range */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                                                        Investment Range
                                                    </label>
                                                    <Slider
                                                        value={investmentRange}
                                                        onValueChange={setInvestmentRange}
                                                        max={1000000}
                                                        step={10000}
                                                        className="mb-2"
                                                    />
                                                    <div className="flex justify-between text-[10px] text-slate-500">
                                                        <span>${(investmentRange[0] / 1000).toFixed(0)}K</span>
                                                        <span>${investmentRange[1] >= 1000000 ? "1M+" : (investmentRange[1] / 1000).toFixed(0) + "K"}</span>
                                                    </div>
                                                </div>

                                                {/* Work Mode */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Work Mode
                                                    </label>
                                                    <div className="space-y-2">
                                                        {["online", "offline", "hybrid"].map(mode => (
                                                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                                                <Checkbox
                                                                    checked={selectedWorkModes.includes(mode)}
                                                                    onCheckedChange={() => toggleWorkMode(mode)}
                                                                />
                                                                <span className="text-sm text-slate-700 capitalize">{mode}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Location */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Location
                                                    </label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                        <Input
                                                            placeholder="Search city..."
                                                            value={locationSearch}
                                                            onChange={(e) => setLocationSearch(e.target.value)}
                                                            className="pl-9 h-9 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Traction */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Traction Stage
                                                    </label>
                                                    <Select value={selectedTraction} onValueChange={setSelectedTraction}>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Any stage" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Any stage</SelectItem>
                                                            {TRACTION_OPTIONS.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Team Size */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                        Team Size
                                                    </label>
                                                    <Select value={selectedTeamSize} onValueChange={setSelectedTeamSize}>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Any size" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Any size</SelectItem>
                                                            {TEAM_SIZE_OPTIONS.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardContent>
                                        </ScrollArea>
                                    </Card>
                                </motion.aside>
                            )}
                        </AnimatePresence>

                        {/* Ideas Grid */}
                        <div className="flex-1">
                            {filteredIdeas.length === 0 ? (
                                <div className="text-center py-20">
                                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">No ideas match your filters</p>
                                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
                                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
                                >
                                    {filteredIdeas.map(idea => {
                                        const status = chatRequests[idea.id];
                                        const isNew = isNewIdea(idea.created_at);
                                        const fundingProgress = Math.round(((idea.investment_received || 0) / idea.investment_needed) * 100);

                                        return (
                                            <motion.div key={idea.id} variants={itemVariants}>
                                                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:ring-2 hover:ring-indigo-500/20 transition-all group cursor-pointer overflow-hidden">
                                                    <CardHeader className="pb-2 relative">
                                                        {isNew && (
                                                            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 gap-1">
                                                                <Sparkles className="w-2.5 h-2.5" /> NEW
                                                            </Badge>
                                                        )}
                                                        <div className="pr-12">
                                                            <CardTitle className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                                {idea.title}
                                                            </CardTitle>
                                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                                                                {idea.domain}
                                                            </CardDescription>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-2 space-y-4">
                                                        {/* Anonymous - No founder name shown */}
                                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                            {idea.description}
                                                        </p>

                                                        {/* Meta Info */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {idea.founder_city && (
                                                                <Badge variant="outline" className="text-[9px] gap-1 py-0.5 bg-slate-50">
                                                                    <MapPin className="w-2.5 h-2.5" /> {idea.founder_city}
                                                                </Badge>
                                                            )}
                                                            {idea.work_mode && (
                                                                <Badge variant="outline" className="text-[9px] gap-1 py-0.5 bg-slate-50 capitalize">
                                                                    <Briefcase className="w-2.5 h-2.5" /> {idea.work_mode}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-[9px] gap-1 py-0.5 bg-slate-50">
                                                                <Clock className="w-2.5 h-2.5" /> {timeAgo(idea.created_at)}
                                                            </Badge>
                                                        </div>

                                                        {/* Investment Info */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-slate-50 rounded-lg p-2.5">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target</p>
                                                                <p className="text-sm font-bold text-slate-900">${idea.investment_needed.toLocaleString()}</p>
                                                            </div>
                                                            <div className="bg-indigo-50 rounded-lg p-2.5">
                                                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Raised</p>
                                                                <p className="text-sm font-bold text-indigo-600">${(idea.investment_received || 0).toLocaleString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div>
                                                            <div className="flex justify-between text-[10px] mb-1">
                                                                <span className="text-slate-500">Funding Progress</span>
                                                                <span className="font-bold text-slate-700">{fundingProgress}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                                                    style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 h-9 text-xs"
                                                                onClick={() => navigate(`/idea/${idea.id}`)}
                                                            >
                                                                View Details
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className={`flex-1 h-9 text-xs ${status === "pending"
                                                                    ? "bg-amber-500 hover:bg-amber-600"
                                                                    : status && ["accepted", "communicating", "deal_done"].includes(status)
                                                                        ? "bg-green-600 hover:bg-green-700"
                                                                        : "bg-indigo-600 hover:bg-indigo-700"
                                                                    }`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRequestConnection(idea);
                                                                }}
                                                            >
                                                                {status === "pending"
                                                                    ? "Pending..."
                                                                    : status && ["accepted", "communicating", "deal_done"].includes(status)
                                                                        ? "Connected ✓"
                                                                        : "Request Connect"}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedGridBackground>
    );
};

export default Marketplace;

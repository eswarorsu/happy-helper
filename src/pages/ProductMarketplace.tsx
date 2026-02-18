import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Search, ArrowLeft, Filter, MapPin, Briefcase, Clock,
    DollarSign, ShoppingBag, Package, Sparkles, Store, ExternalLink,
    Tag, Star, ChevronDown, User, MessageSquare
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileViewModal } from "@/components/ProfileViewModal";

interface Product {
    id: string;
    founder_id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    category?: string;
    is_live: boolean;
    created_at: string;
    founder?: {
        id: string;
        name: string;
        avatar_url?: string;
        user_type: "investor" | "founder" | "admin";
        bio?: string;
        linkedin_profile?: string;
        email?: string;
        created_at: string;
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const ProductMarketplace = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedFounder, setSelectedFounder] = useState<any>(null);
    const [chatRequests, setChatRequests] = useState<any[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    const fetchChatRequests = async (profileId: string) => {
        try {
            const { data, error } = await supabase
                .from("chat_requests")
                .select("*")
                .eq("investor_id", profileId);
            if (error) throw error;
            setChatRequests(data || []);
        } catch (error) {
            console.error("Error fetching chat requests:", error);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Get current user profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("user_id", user.id)
                        .single();
                    setCurrentUserProfile(profile);
                    if (profile) fetchChatRequests(profile.id);
                }

                // Get products with founder details
                const { data, error } = await supabase
                    .from("products")
                    .select(`
                        *,
                        founder:profiles!founder_id(*)
                    `)
                    .eq("is_live", true)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (error: any) {
                console.error("Error in init:", error);
                toast({ title: "Error", description: "Could not load marketplace data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const handleConnect = async (founderId: string) => {
        if (!currentUserProfile) {
            toast({ title: "Auth Required", description: "Please sign in to connect.", variant: "destructive" });
            return;
        }

        try {
            const { data, error } = await supabase
                .from("chat_requests")
                .insert({
                    founder_id: founderId,
                    investor_id: currentUserProfile.id,
                    status: "pending"
                })
                .select()
                .single();

            if (error) throw error;

            setChatRequests([...chatRequests, data]);
            toast({ title: "Request Sent!", description: "Waiting for founder's approval." });
        } catch (error: any) {
            console.error("Error connecting:", error);
            toast({ title: "Error", description: error.message || "Could not send request.", variant: "destructive" });
        }
    };

    const getConnectionStatus = (founderId: string) => {
        const request = chatRequests.find(r => r.founder_id === founderId);
        return request ? request.status : null;
    };

    const categories = ["all", ...new Set(products.map(p => p.category || "General"))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.founder?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/investor-dashboard")} className="hidden md:flex">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                        </Button>
                        <div className="flex items-center gap-2">
                            <Logo size="sm" />
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Marketplace</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Founders' Creations</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search products, founders..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all shadow-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold py-1 px-3">
                            <Sparkles className="w-3 h-3 mr-1.5" /> Investor Exclusive
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Intro Section */}
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Invest in tangible products</h2>
                        <p className="text-slate-500 text-lg">
                            Explore what our founders are building. From innovative SaaS tools to physical prototypes,
                            see the value they're creating beyond the pitch deck.
                        </p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-full px-6 font-bold h-10 capitalize ${selectedCategory === cat
                                ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* Grid */}
                {filteredProducts.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {filteredProducts.map(product => (
                            <motion.div key={product.id} variants={itemVariants}>
                                <Card className="group h-full flex flex-col bg-white border-slate-200 rounded-[32px] overflow-hidden hover:shadow-2xl hover:border-brand-yellow/30 transition-all duration-500">
                                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                <Package className="w-16 h-16 mb-2" />
                                                <span className="text-xs font-bold uppercase tracking-widest">No Preview Available</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-xs py-1.5 px-3 shadow-lg">
                                                ${product.price}
                                            </Badge>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter text-slate-400 border-slate-200 mb-2">
                                                    {product.category || "General"}
                                                </Badge>
                                                <CardTitle className="text-xl font-black text-slate-900 line-clamp-1">{product.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-4">
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">
                                            {product.description}
                                        </p>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {product.founder?.name?.charAt(0) || "F"}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{product.founder?.name || "Founder"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-brand-yellow">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-[10px] font-black">4.9</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 p-6 flex gap-3">
                                        {getConnectionStatus(product.founder_id) === 'accepted' || getConnectionStatus(product.founder_id) === 'communicating' ? (
                                            <Button
                                                className="flex-1 bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/80 font-bold rounded-2xl h-11 transition-all"
                                                onClick={() => navigate('/investor-dashboard')}
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" /> Message
                                            </Button>
                                        ) : getConnectionStatus(product.founder_id) === 'pending' ? (
                                            <Button
                                                disabled
                                                className="flex-1 bg-slate-100 text-slate-400 font-bold rounded-2xl h-11"
                                            >
                                                Pending...
                                            </Button>
                                        ) : (
                                            <Button
                                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-11 transition-all"
                                                onClick={() => setSelectedFounder(product.founder)}
                                            >
                                                Contact Founder
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline" size="icon" className="w-11 h-11 rounded-2xl border-slate-200 hover:bg-slate-50"
                                            onClick={() => setSelectedFounder(product.founder)}
                                        >
                                            <User className="w-4 h-4 text-slate-600" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No products found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            We couldn't find any products matching your criteria. Try adjusting your filters or search query.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                            className="rounded-xl"
                        >
                            Reset Filters
                        </Button>
                    </div>
                )}
            </main>

            {/* Profile Modal */}
            <ProfileViewModal
                isOpen={!!selectedFounder}
                onClose={() => setSelectedFounder(null)}
                profile={selectedFounder}
                actionButton={
                    selectedFounder && (
                        getConnectionStatus(selectedFounder.id) === 'accepted' || getConnectionStatus(selectedFounder.id) === 'communicating' ? (
                            <Button
                                className="w-full bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/80 font-bold mt-4"
                                onClick={() => navigate('/investor-dashboard')}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> Open Messages
                            </Button>
                        ) : getConnectionStatus(selectedFounder.id) === 'pending' ? (
                            <Button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-bold mt-4"
                            >
                                Request Pending
                            </Button>
                        ) : (
                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold mt-4"
                                onClick={() => handleConnect(selectedFounder.id)}
                            >
                                Connect with {selectedFounder.name}
                            </Button>
                        )
                    )
                }
            />
        </div>
    );
};

export default ProductMarketplace;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Package, DollarSign, Store, ArrowLeft, 
    Trash2, Edit2, Rocket, ShoppingBag, TrendingUp, BarChart3, Tag
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const ProductLaunch = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const [profile, setProfile] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Product Form State
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: ""
    });

    useEffect(() => {
        const init = async () => {
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

            if (!profileData || profileData.user_type !== "founder") {
                navigate("/");
                return;
            }

            setProfile(profileData);
            await fetchProducts(profileData.id);
            setIsLoading(false);
        };

        init();
    }, [navigate]);

    const fetchProducts = async (founderId: string) => {
        try {
            const { data, error } = await supabase
                .from("products" as any)
                .select("*")
                .eq("founder_id", founderId)
                .order("created_at", { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist yet, we'll handle this gracefully
                    console.warn("Products table does not exist yet.");
                    setProducts([]);
                } else {
                    throw error;
                }
            } else {
                setProducts(data || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.description || !newProduct.price) {
            toast({ title: "Incomplete details", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const priceNum = parseFloat(newProduct.price);
            if (isNaN(priceNum)) throw new Error("Invalid price");

            const { error } = await supabase
                .from("products" as any)
                .insert({
                    founder_id: profile.id,
                    name: newProduct.name,
                    description: newProduct.description,
                    price: priceNum,
                    category: newProduct.category,
                    image_url: newProduct.image_url || null,
                    is_live: true
                });

            if (error) throw error;

            toast({ title: "Product Launched! 🚀", description: "Your product is now listed in the marketplace." });
            setIsAddModalOpen(false);
            setNewProduct({ name: "", description: "", price: "", category: "", image_url: "" });
            await fetchProducts(profile.id);
        } catch (error: any) {
            toast({ title: "Error launching product", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("Are you sure you want to remove this product?")) return;

        try {
            const { error } = await supabase
                .from("products" as any)
                .delete()
                .eq("id", productId);

            if (error) throw error;

            toast({ title: "Product removed" });
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/founder-dashboard")} className="hidden md:flex">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-2">
                            <Logo size="sm" />
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Product Launchpad</h1>
                        </div>
                    </div>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-charcoal hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200">
                                <Plus className="w-4 h-4 mr-2" /> Launch Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Launch New Product</DialogTitle>
                                <DialogDescription>Fill in the details to list your product in the founder marketplace.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Product Name</label>
                                    <Input 
                                        placeholder="Awesome SaaS Tool" 
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                        className="rounded-xl border-slate-200 focus:ring-brand-yellow/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Description</label>
                                    <Textarea 
                                        placeholder="Tell us what your product does..." 
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                        className="rounded-xl border-slate-200 h-24 focus:ring-brand-yellow/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Price (USD)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input 
                                                type="number" 
                                                placeholder="99.00" 
                                                value={newProduct.price}
                                                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                                className="pl-9 rounded-xl border-slate-200 focus:ring-brand-yellow/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Category</label>
                                        <Input 
                                            placeholder="SaaS, DevTool, AI" 
                                            value={newProduct.category}
                                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                            className="rounded-xl border-slate-200 focus:ring-brand-yellow/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Image URL (Optional)</label>
                                    <Input 
                                        placeholder="https://example.com/image.jpg" 
                                        value={newProduct.image_url}
                                        onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                                        className="rounded-xl border-slate-200 focus:ring-brand-yellow/20"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button 
                                    onClick={handleAddProduct} 
                                    className="bg-brand-charcoal hover:bg-slate-800 text-white font-bold rounded-xl"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Launching..." : "Launch Product 🚀"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Products</h3>
                        <p className="text-3xl font-black mt-1">{products.length}</p>
                    </motion.div>
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Market Visiblity</h3>
                        <p className="text-3xl font-black mt-1">Founders Only</p>
                    </motion.div>
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center mb-4">
                            <BarChart3 className="w-6 h-6 text-brand-charcoal" />
                        </div>
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Avg. Listing Price</h3>
                        <p className="text-3xl font-black mt-1">
                            ${products.length > 0 
                                ? (products.reduce((acc, p) => acc + p.price, 0) / products.length).toFixed(2) 
                                : "0.00"}
                        </p>
                    </motion.div>
                </div>

                {/* Products List */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Your Product Fleet</h2>
                        <p className="text-slate-500">Manage your marketing place listings</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {products.length > 0 ? (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {products.map((product) => (
                                <motion.div key={product.id} variants={itemVariants}>
                                    <Card className="group h-full flex flex-col bg-white border-slate-200 overflow-hidden rounded-3xl hover:shadow-xl hover:border-brand-yellow/30 transition-all duration-300">
                                        {product.image_url ? (
                                            <div className="h-48 overflow-hidden bg-slate-100">
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-48 bg-slate-50 flex items-center justify-center">
                                                <Package className="w-12 h-12 text-slate-200" />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl font-bold line-clamp-1">{product.name}</CardTitle>
                                                    <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                                                        {product.category || "Product"}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-emerald-600">${product.price}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Listed Price</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                                                {product.description}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex gap-2">
                                            <Button variant="outline" className="flex-1 rounded-xl h-10 border-slate-200 hover:bg-slate-50">
                                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl h-10 w-10 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-32 flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Rocket className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to Launch?</h3>
                            <p className="text-slate-500 max-w-sm mb-8">
                                List your MVP, SaaS, or any product to showcase it to other founders and investors in the marketplace.
                            </p>
                            <Button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-brand-charcoal hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-slate-200"
                            >
                                Start Your First Launch
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default ProductLaunch;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Package, DollarSign, Store,
    Trash2, Edit2, Rocket, ShoppingBag, TrendingUp, BarChart3, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface Product {
    id: string;
    founder_id: string;
    idea_id: string | null;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    category?: string;
    is_live: boolean;
    created_at: string;
}

interface IdeaProductSectionProps {
    ideaId: string;
    isFounder: boolean;
    founderId: string;
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

export function IdeaProductSection({ ideaId, isFounder, founderId }: IdeaProductSectionProps) {
    const { toast } = useToast();
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
        fetchProducts();
    }, [ideaId]);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from("products" as any)
                .select("*")
                .eq("idea_id", ideaId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
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
                    founder_id: founderId,
                    idea_id: ideaId,
                    name: newProduct.name,
                    description: newProduct.description,
                    price: priceNum,
                    category: newProduct.category || "General",
                    image_url: newProduct.image_url || null,
                    is_live: true
                });

            if (error) throw error;

            toast({ title: "Product Launched! 🚀", description: "Your product is now listed for this idea." });
            setIsAddModalOpen(false);
            setNewProduct({ name: "", description: "", price: "", category: "", image_url: "" });
            fetchProducts();
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
            <div className="py-20 flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full mb-4"
                />
                <p className="text-slate-500 text-sm font-medium">Scanning product fleet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {isFounder && (
                <div className="flex justify-center">
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl px-6 py-6 shadow-xl shadow-slate-200 h-auto gap-3">
                                <Plus className="w-5 h-5" />
                                Launch New {products.length > 0 ? 'Adjacent' : ''} Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900">Launch Product</DialogTitle>
                                <DialogDescription>List a new product or MVP related to this idea.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Product Name</label>
                                    <Input
                                        placeholder="Awesome SaaS Tool"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="rounded-xl border-slate-200 h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Description</label>
                                    <Textarea
                                        placeholder="Tell us what your product does..."
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="rounded-xl border-slate-200 h-24"
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
                                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="pl-9 rounded-xl border-slate-200 h-12"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Category</label>
                                        <Input
                                            placeholder="SaaS, DevTool, AI"
                                            value={newProduct.category}
                                            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                            className="rounded-xl border-slate-200 h-12"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Image URL</label>
                                    <Input
                                        placeholder="https://example.com/image.jpg"
                                        value={newProduct.image_url}
                                        onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                        className="rounded-xl border-slate-200 h-12"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                                <Button
                                    onClick={handleAddProduct}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl px-8 h-12 shadow-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Launching..." : "Launch Now 🚀"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <AnimatePresence mode="wait">
                {products.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {products.map((product) => (
                            <motion.div key={product.id} variants={itemVariants}>
                                <Card className="group h-full flex flex-col bg-white border-slate-200 overflow-hidden rounded-[32px] hover:shadow-2xl hover:border-brand-yellow/30 transition-all duration-500">
                                    {product.image_url ? (
                                        <div className="h-48 overflow-hidden bg-slate-100 relative">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-xs py-1.5 px-3 shadow-lg">
                                                    ${product.price}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-slate-50 flex flex-col items-center justify-center text-slate-300 relative">
                                            <Package className="w-12 h-12 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Preview</span>
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-xs py-1.5 px-3 shadow-lg">
                                                    ${product.price}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
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
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                                            {product.description}
                                        </p>
                                    </CardContent>
                                    {isFounder && (
                                        <CardFooter className="pt-0 p-6 flex gap-2">
                                            <Button variant="outline" className="flex-1 rounded-xl h-10 border-slate-200 hover:bg-slate-50 font-bold">
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
                                    )}
                                    {!isFounder && (
                                        <CardFooter className="pt-0 p-6">
                                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-11 transition-all">
                                                Inquire Details
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-center px-6"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Rocket className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                            {isFounder ? "No Products Launched Yet" : "No Live Products Available"}
                        </h3>
                        <p className="text-slate-500 max-w-sm mb-8">
                            {isFounder
                                ? "Launch an MVP or related product to show investors your execution capabilities."
                                : "The founder hasn't listed any specific products for this idea yet."}
                        </p>
                        {isFounder && (
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-brand-charcoal hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-slate-200"
                            >
                                Start First Launch
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default IdeaProductSection;

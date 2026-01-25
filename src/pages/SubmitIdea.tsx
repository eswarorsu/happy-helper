import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    Rocket,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Link as LinkIcon,
    CheckCircle2,
    Check,
    DollarSign,
    Target,
    Zap,
    Menu,
    User,
    LogOut,
    ShieldCheck,
    Activity,
    Users,
    TrendingUp,
    Lightbulb,
    Globe,
    Linkedin
} from "lucide-react";

const DOMAINS = [
    "FinTech", "HealthTech", "EdTech", "AI/ML", "SaaS", "E-commerce",
    "CleanTech", "AgriTech", "PropTech", "Gaming", "Social Media", "Logistics", "Other"
];

const STEPS = [
    { id: 1, title: "Basic Details", subtitle: "Project name & industry" },
    { id: 2, title: "Traction & Team", subtitle: "Validation metrics" },
    { id: 3, title: "The Pitch", subtitle: "Tell your story" }
];

const SubmitIdea = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [ideasCount, setIdeasCount] = useState(0);

    const [formData, setFormData] = useState({
        title: "",
        domain: "",
        description: "",
        investment_needed: "",
        drive_link: "",
        team_size: "",
        market_size: "",
        traction: "",
        linkedin_url: "",
        website_url: ""
    });

    useEffect(() => {
        const verifyAccess = async () => {
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

            // Fetch ideas count
            const { count } = await supabase
                .from("ideas")
                .select("*", { count: 'exact', head: true })
                .eq("founder_id", profileData.id);
            setIdeasCount(count || 0);

            const paymentId = searchParams.get("payment_id");
            const couponCode = searchParams.get("coupon");
            let hasValidAccess = false;

            if (paymentId) {
                const { data } = await supabase.from("payments").select("*").eq("razorpay_payment_id", paymentId).eq("status", "success").is("idea_id", null).single();
                if (data) hasValidAccess = true;
            } else if (couponCode) {
                const { data } = await supabase.from("payments").select("*").eq("user_id", session.user.id).eq("status", "success").eq("razorpay_signature", "COUPON_REDEMPTION").is("idea_id", null).order("created_at", { ascending: false }).limit(1).single();
                if (data) hasValidAccess = true;
            } else {
                const { data } = await supabase.from("payments").select("*").eq("user_id", session.user.id).eq("status", "success").is("idea_id", null).order("created_at", { ascending: false }).limit(1).single();
                if (data) hasValidAccess = true;
            }

            if (hasValidAccess) {
                setPaymentVerified(true);
            } else {
                toast({
                    title: "Access Denied",
                    description: "Please complete payment before submitting an idea.",
                    variant: "destructive"
                });
                navigate("/payment");
                return;
            }

            setIsLoading(false);
        };

        verifyAccess();
    }, [navigate, searchParams, toast]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const isValidDriveLink = (url: string) => {
        if (!url) return true;
        return url.includes("drive.google.com") || url.includes("docs.google.com");
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (formData.title.length < 5) {
                toast({ title: "Title too short", description: "Minimum 5 characters required", variant: "destructive" });
                return false;
            }
            if (!formData.domain) {
                toast({ title: "Select a domain", variant: "destructive" });
                return false;
            }
            if (!formData.investment_needed || parseFloat(formData.investment_needed) < 1000) {
                toast({ title: "Investment min $1,000", variant: "destructive" });
                return false;
            }
        }
        if (step === 3) {
            if (formData.description.length < 50) {
                toast({ title: "Description too short", description: "Minimum 50 characters required", variant: "destructive" });
                return false;
            }
            if (formData.drive_link && !isValidDriveLink(formData.drive_link)) {
                toast({ title: "Invalid Drive Link", variant: "destructive" });
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(3) || !profile) return;

        setIsSubmitting(true);

        try {
            const { data: ideaData, error } = await supabase
                .from("ideas")
                .insert({
                    founder_id: profile.id,
                    title: formData.title,
                    description: formData.description,
                    domain: formData.domain,
                    investment_needed: parseFloat(formData.investment_needed),
                    media_url: formData.drive_link || null,
                    team_size: formData.team_size || "Solopreneur",
                    market_size: formData.market_size || null,
                    traction: formData.traction || null,
                    linkedin_url: formData.linkedin_url || null,
                    website_url: formData.website_url || null,
                    status: "pending"
                })
                .select()
                .single();

            if (error) throw error;

            const paymentId = searchParams.get("payment_id");
            if (paymentId) {
                await supabase.from("payments").update({ idea_id: ideaData.id }).eq("razorpay_payment_id", paymentId);
            } else {
                await supabase.from("payments").update({ idea_id: ideaData.id }).eq("user_id", profile.user_id).eq("status", "success").is("idea_id", null).order("created_at", { ascending: false }).limit(1);
            }

            toast({ title: "Idea Submitted! 🚀", description: "Your vision is under review." });
            navigate("/founder-dashboard");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 font-sans relative">
            <div className="fixed inset-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] -ml-64 -mb-64" />
            </div>

            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 text-slate-600 hover:bg-slate-100 rounded-full w-10 h-10">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px]">
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                        <Rocket className="w-5 h-5 text-indigo-600" /> Menu
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="space-y-2">
                                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => navigate("/founder-dashboard")}>
                                        <Rocket className="w-5 h-5 mr-3" /> Dashboard
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 group" onClick={() => navigate("/founder-dashboard?scrollTo=ideas")}>
                                        <Lightbulb className="w-5 h-5 mr-3" />
                                        <span className="flex-1 text-left">Ideas Submitted</span>
                                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 ml-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {ideasCount}
                                        </Badge>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => navigate("/profile")}>
                                        <User className="w-5 h-5 mr-3" /> Profile
                                    </Button>
                                    <div className="pt-4 mt-4 border-t border-slate-100">
                                        <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                                            <LogOut className="w-5 h-5 mr-3" /> Sign Out
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="flex flex-col">
                            <h1 className="font-black text-2xl tracking-tighter text-slate-900 leading-none">INNOVESTOR</h1>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-1">Founder OS</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-900">Welcome, {profile?.name}</span>
                            {profile?.is_approved ? (
                                <Badge className="bg-emerald-500 text-white gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1 shadow-sm shadow-emerald-100 ring-2 ring-emerald-50">
                                    <ShieldCheck size={12} /> Verified Founder
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[9px] gap-1 px-2 py-0.5 rounded-full mt-1 bg-slate-100 text-slate-500">
                                    <Activity size={10} /> Verification Pending
                                </Badge>
                            )}
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="font-bold bg-indigo-50 text-indigo-600">
                                {profile?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-10">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/founder-dashboard")}
                    className="mb-6 text-slate-500 hover:text-slate-700 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Progress Steps */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-0 shadow-lg rounded-2xl p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Submit Idea</h3>
                            <div className="space-y-1">
                                {STEPS.map((step, index) => (
                                    <div key={step.id}>
                                        <div className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${currentStep === step.id ? 'bg-indigo-50' : currentStep > step.id ? 'bg-slate-50' : 'opacity-50'}`}
                                            onClick={() => setCurrentStep(step.id)}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep === step.id
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : currentStep > step.id
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'border-2 border-slate-200 text-slate-400'
                                                }`}>
                                                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${currentStep === step.id ? 'text-indigo-600' : currentStep > step.id ? 'text-slate-700' : 'text-slate-400'}`}>
                                                    {step.title}
                                                </p>
                                                <p className={`text-xs ${currentStep === step.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                    {step.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div className={`w-0.5 h-4 ml-8 ${currentStep > step.id ? 'bg-green-200' : 'bg-slate-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {paymentVerified && (
                                <div className="mt-6 p-3 bg-green-50 border border-green-100 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-bold text-green-700">Payment Verified</span>
                                    </div>
                                    <p className="text-[10px] text-green-600">Ready to submit</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content - Form Steps */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border-0 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-slate-900">
                                    {STEPS[currentStep - 1].title}
                                </CardTitle>
                                <CardDescription>{STEPS[currentStep - 1].subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Basic Details */}
                                {currentStep === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-sm font-bold text-slate-700">Project Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g., AI-Powered Health Diagnostics"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="h-12 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl"
                                                maxLength={100}
                                            />
                                            <p className="text-[10px] text-slate-400 font-medium">{formData.title.length}/100 characters</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700">Domain / Industry *</Label>
                                            <Select value={formData.domain} onValueChange={(value) => setFormData({ ...formData, domain: value })}>
                                                <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl">
                                                    <SelectValue placeholder="Select a domain" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DOMAINS.map((domain) => (
                                                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="investment" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-indigo-600" />
                                                Investment Goal (USD) *
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <Input
                                                    id="investment"
                                                    type="number"
                                                    placeholder="50,000"
                                                    value={formData.investment_needed}
                                                    onChange={(e) => setFormData({ ...formData, investment_needed: e.target.value })}
                                                    className="h-12 pl-8 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl"
                                                    min={1000}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">Minimum: $1,000</p>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Traction & Team */}
                                {currentStep === 2 && (
                                    <>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-indigo-600" />
                                                    Team Size
                                                </Label>
                                                <Select value={formData.team_size} onValueChange={(v) => setFormData({ ...formData, team_size: v })}>
                                                    <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl">
                                                        <SelectValue placeholder="Solo Founder" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Solo Founder">Solo Founder</SelectItem>
                                                        <SelectItem value="2-5 People">2-5 People</SelectItem>
                                                        <SelectItem value="5-10 People">5-10 People</SelectItem>
                                                        <SelectItem value="10+ People">10+ People</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                                    Current Traction
                                                </Label>
                                                <Select value={formData.traction} onValueChange={(v) => setFormData({ ...formData, traction: v })}>
                                                    <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl">
                                                        <SelectValue placeholder="Idea Stage" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Idea Stage">Idea Stage</SelectItem>
                                                        <SelectItem value="Prototype/MVP">Prototype / MVP</SelectItem>
                                                        <SelectItem value="Early Adopters">Early Adopters</SelectItem>
                                                        <SelectItem value="Generating Revenue">Generating Revenue</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700">
                                                Market Size (TAM) <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                                            </Label>
                                            <Input
                                                placeholder="e.g., $10B Global Market"
                                                value={formData.market_size}
                                                onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                                                className="h-12 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Step 3: The Pitch */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-bold text-slate-700">
                                                Describe Your Vision *
                                            </Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe your idea, the problem it solves, target market, competitive advantage, and your vision..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="min-h-[150px] bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl resize-none"
                                                maxLength={2000}
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Be concise & compelling (minimum 50 characters)
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-300">{formData.description.length}/2000</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700">
                                                Pitch Deck Link <span className="text-[10px] font-normal text-slate-400">(Google Drive)</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    placeholder="https://docs.google.com/presentation/d/..."
                                                    value={formData.drive_link}
                                                    onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                                                    className="h-12 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl pr-10"
                                                />
                                                {formData.drive_link && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        {isValidDriveLink(formData.drive_link) ?
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                                            <div className="w-2 h-2 bg-red-400 rounded-full" />
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Linkedin className="w-4 h-4 text-indigo-600" />
                                                    LinkedIn <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="linkedin.com/in/..."
                                                    value={formData.linkedin_url}
                                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                                    className="h-12 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-indigo-600" />
                                                    Website <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={formData.website_url}
                                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                                    className="h-12 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex gap-3 pt-4">
                                    {currentStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="flex-1 h-12 rounded-xl border-slate-200"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Previous
                                        </Button>
                                    )}
                                    {currentStep < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100"
                                        >
                                            Continue
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="w-4 h-4 mr-2" />
                                                    Submit Idea
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SubmitIdea;

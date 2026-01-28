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
import {
    Rocket, ArrowLeft, ArrowRight, CheckCircle2, Check, DollarSign,
    Users, TrendingUp, Lightbulb, Globe, Linkedin, ShieldCheck, LogOut
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
                toast({ title: "Access Denied", description: "Please complete payment before submitting an idea.", variant: "destructive" });
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
        if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Verifying access...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">INNOVESTOR</h1>
                            <p className="text-xs text-slate-500 font-medium">Submit Idea</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-900">{profile?.name}</span>
                            {profile?.is_approved ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">Pending</Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-600">
                            <LogOut className="w-4 h-4" />
                        </Button>
                        <Avatar className="h-9 w-9 border-2 border-slate-100 shadow-sm">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-slate-900 text-white font-semibold text-sm">
                                {profile?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/founder-dashboard")}
                    className="mb-6 text-slate-500 hover:text-slate-700 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Progress Steps */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-200 shadow-sm sticky top-24">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-slate-900">Submit Idea</CardTitle>
                                <CardDescription>Complete all steps to launch</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {STEPS.map((step, index) => (
                                    <div key={step.id}>
                                        <div
                                            className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${currentStep === step.id ? 'bg-slate-100' : currentStep > step.id ? 'bg-slate-50' : 'opacity-50'
                                                }`}
                                            onClick={() => setCurrentStep(step.id)}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep === step.id
                                                    ? 'bg-slate-900 text-white'
                                                    : currentStep > step.id
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : 'border-2 border-slate-200 text-slate-400'
                                                }`}>
                                                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${currentStep === step.id ? 'text-slate-900' : currentStep > step.id ? 'text-slate-700' : 'text-slate-400'}`}>
                                                    {step.title}
                                                </p>
                                                <p className={`text-xs ${currentStep === step.id ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {step.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div className={`w-0.5 h-3 ml-[26px] ${currentStep > step.id ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                                        )}
                                    </div>
                                ))}

                                {paymentVerified && (
                                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-semibold text-emerald-700">Payment Verified</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Content - Form Steps */}
                    <div className="lg:col-span-2">
                        <Card className="border border-slate-200 shadow-sm">
                            <CardHeader className="border-b border-slate-100">
                                <CardTitle className="text-xl font-bold text-slate-900">{STEPS[currentStep - 1].title}</CardTitle>
                                <CardDescription>{STEPS[currentStep - 1].subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1: Basic Details */}
                                {currentStep === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Project Title *</Label>
                                            <Input
                                                placeholder="e.g., AI-Powered Health Diagnostics"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="h-11 bg-white border-slate-200 rounded-lg"
                                                maxLength={100}
                                            />
                                            <p className="text-xs text-slate-400">{formData.title.length}/100 characters</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Domain / Industry *</Label>
                                            <Select value={formData.domain} onValueChange={(value) => setFormData({ ...formData, domain: value })}>
                                                <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg">
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
                                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-slate-500" />
                                                Investment Goal (USD) *
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                                <Input
                                                    type="number"
                                                    placeholder="50,000"
                                                    value={formData.investment_needed}
                                                    onChange={(e) => setFormData({ ...formData, investment_needed: e.target.value })}
                                                    className="h-11 pl-8 bg-white border-slate-200 rounded-lg"
                                                    min={1000}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400">Minimum: $1,000</p>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Traction & Team */}
                                {currentStep === 2 && (
                                    <>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-500" />
                                                    Team Size
                                                </Label>
                                                <Select value={formData.team_size} onValueChange={(v) => setFormData({ ...formData, team_size: v })}>
                                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg">
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
                                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-slate-500" />
                                                    Current Traction
                                                </Label>
                                                <Select value={formData.traction} onValueChange={(v) => setFormData({ ...formData, traction: v })}>
                                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg">
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
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Market Size (TAM) <span className="text-xs font-normal text-slate-400">(Optional)</span>
                                            </Label>
                                            <Input
                                                placeholder="e.g., $10B Global Market"
                                                value={formData.market_size}
                                                onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                                                className="h-11 bg-white border-slate-200 rounded-lg"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Step 3: The Pitch */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Describe Your Vision *</Label>
                                            <Textarea
                                                placeholder="Describe your idea, the problem it solves, target market, competitive advantage, and your vision..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="min-h-[150px] bg-white border-slate-200 rounded-lg resize-none"
                                                maxLength={2000}
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Lightbulb className="w-3 h-3" />
                                                    Be concise & compelling (minimum 50 characters)
                                                </p>
                                                <p className="text-xs text-slate-300">{formData.description.length}/2000</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Pitch Deck Link <span className="text-xs font-normal text-slate-400">(Google Drive)</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    placeholder="https://docs.google.com/presentation/d/..."
                                                    value={formData.drive_link}
                                                    onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                                                    className="h-11 bg-white border-slate-200 rounded-lg pr-10"
                                                />
                                                {formData.drive_link && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        {isValidDriveLink(formData.drive_link) ?
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                                                            <div className="w-2 h-2 bg-red-400 rounded-full" />
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Linkedin className="w-4 h-4 text-slate-500" />
                                                    LinkedIn <span className="text-xs font-normal text-slate-400">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="linkedin.com/in/..."
                                                    value={formData.linkedin_url}
                                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                                    className="h-11 bg-white border-slate-200 rounded-lg"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-500" />
                                                    Website <span className="text-xs font-normal text-slate-400">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={formData.website_url}
                                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                                    className="h-11 bg-white border-slate-200 rounded-lg"
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
                                            className="flex-1 h-11 rounded-lg border-slate-200 text-slate-700"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                                        </Button>
                                    )}
                                    {currentStep < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                                        >
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="w-4 h-4 mr-2" /> Submit Idea
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

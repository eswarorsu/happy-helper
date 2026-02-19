import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    ArrowLeft, ArrowRight, CheckCircle2, Check, DollarSign,
    Users, TrendingUp, Lightbulb, Globe, Linkedin, ShieldCheck, LogOut,
    MapPin, Phone, Briefcase
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { evaluateFounderSubmitAccess, ensurePremiumFlag, type SubmitAccessResult } from "@/lib/founderAccess";

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

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [access, setAccess] = useState<SubmitAccessResult | null>(null);

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
        website_url: "",
        founder_city: "",
        founder_phone: "",
        work_mode: ""
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

            await ensurePremiumFlag(session.user.id);

            const { data: refreshedProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

            const activeProfile = refreshedProfile || profileData;
            setProfile(activeProfile);

            const accessResult = await evaluateFounderSubmitAccess(activeProfile);
            setAccess(accessResult);

            if (accessResult.allowed) {
                setPaymentVerified(true);
                setIsLoading(false);
                return;
            }

            toast({ title: "Payment Required", description: "Complete payment or use an available coupon to submit another idea.", variant: "destructive" });
            navigate("/payment");
            return;

        };

        verifyAccess();
    }, [navigate, toast]);

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
                    founder_city: formData.founder_city || null,
                    founder_phone: formData.founder_phone || null,
                    work_mode: formData.work_mode || null,
                    status: "pending"
                })
                .select()
                .single();

            if (error) throw error;

            if (access?.reason === "payment_or_coupon" && access.unclaimedPaymentRecordId) {
                await ((supabase as any)
                    .from("payments")
                    .update({ idea_id: ideaData.id })
                    .eq("id", access.unclaimedPaymentRecordId) as any);
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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Verifying access...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 transition-all">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <div>
                            <h1 className="text-lg font-bold text-foreground tracking-tight">INNOVESTOR</h1>
                            <p className="text-xs text-muted-foreground font-medium">Submit Idea</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-semibold text-foreground">{profile?.name}</span>
                            {profile?.is_approved ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground">Pending</Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-600">
                            <LogOut className="w-4 h-4" />
                        </Button>
                        <Avatar className="h-9 w-9 border-2 border-border/60 shadow-sm">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-brand-yellow text-brand-charcoal font-semibold text-sm">
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
                    className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Progress Steps */}
                    <div className="lg:col-span-1">
                        <Card className="border border-border shadow-sm sticky top-24 rounded-2xl bg-white">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-foreground">Submit Idea</CardTitle>
                                <CardDescription>Complete all steps to launch</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {STEPS.map((step, index) => (
                                    <div key={step.id}>
                                        <div
                                            className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${currentStep === step.id ? 'bg-primary/10' : currentStep > step.id ? 'bg-secondary' : 'opacity-50'
                                                }`}
                                            onClick={() => setCurrentStep(step.id)}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep === step.id
                                                ? 'bg-primary text-primary-foreground'
                                                : currentStep > step.id
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'border-2 border-border text-muted-foreground'
                                                }`}>
                                                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${currentStep === step.id ? 'text-foreground' : currentStep > step.id ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                                                    {step.title}
                                                </p>
                                                <p className={`text-xs ${currentStep === step.id ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                                    {step.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div className={`w-0.5 h-3 ml-[26px] ${currentStep > step.id ? 'bg-emerald-200' : 'bg-border'}`} />
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
                        <Card className="border border-border shadow-sm bg-white rounded-2xl">
                            <CardHeader className="border-b border-border/60">
                                <CardTitle className="text-xl font-bold text-foreground">{STEPS[currentStep - 1].title}</CardTitle>
                                <CardDescription>{STEPS[currentStep - 1].subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1: Basic Details */}
                                {currentStep === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-foreground">Project Title *</Label>
                                            <Input
                                                placeholder="e.g., AI-Powered Health Diagnostics"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="h-11 bg-white border-border rounded-lg text-foreground"
                                                maxLength={100}
                                            />
                                            <p className="text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-foreground">Domain / Industry *</Label>
                                            <Select value={formData.domain} onValueChange={(value) => setFormData({ ...formData, domain: value })}>
                                                <SelectTrigger className="h-11 bg-white border-border rounded-lg text-foreground">
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
                                            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                Investment Goal (USD) *
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                                <Input
                                                    type="number"
                                                    placeholder="50,000"
                                                    value={formData.investment_needed}
                                                    onChange={(e) => setFormData({ ...formData, investment_needed: e.target.value })}
                                                    className="h-11 pl-8 bg-white border-border rounded-lg text-foreground"
                                                    min={1000}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Minimum: $1,000</p>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: Traction & Team */}
                                {currentStep === 2 && (
                                    <>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                    Team Size
                                                </Label>
                                                <Select value={formData.team_size} onValueChange={(v) => setFormData({ ...formData, team_size: v })}>
                                                    <SelectTrigger className="h-11 bg-white border-border rounded-lg text-foreground">
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
                                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                                    Current Traction
                                                </Label>
                                                <Select value={formData.traction} onValueChange={(v) => setFormData({ ...formData, traction: v })}>
                                                    <SelectTrigger className="h-11 bg-white border-border rounded-lg text-foreground">
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
                                            <Label className="text-sm font-semibold text-foreground">
                                                Market Size (TAM) <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                                            </Label>
                                            <Input
                                                placeholder="e.g., $10B Global Market"
                                                value={formData.market_size}
                                                onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                                                className="h-11 bg-white border-border rounded-lg text-foreground"
                                            />
                                        </div>

                                        {/* NEW: Location & Work Mode Fields */}
                                        <div className="border-t border-border/60 pt-6 mt-4">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Contact & Location</p>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        City / Location
                                                    </Label>
                                                    <Input
                                                        placeholder="e.g., Hyderabad, India"
                                                        value={formData.founder_city}
                                                        onChange={(e) => setFormData({ ...formData, founder_city: e.target.value })}
                                                        className="h-11 bg-white border-border rounded-lg text-foreground"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Helps investors filter by proximity</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                                                        Work Mode
                                                    </Label>
                                                    <Select value={formData.work_mode} onValueChange={(v) => setFormData({ ...formData, work_mode: v })}>
                                                        <SelectTrigger className="h-11 bg-white border-border rounded-lg text-foreground">
                                                            <SelectValue placeholder="Select work mode" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="online">Online / Remote</SelectItem>
                                                            <SelectItem value="offline">Offline / In-Person</SelectItem>
                                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-4">
                                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    Phone Number <span className="text-xs font-normal text-muted-foreground">(Private - not shared with investors)</span>
                                                </Label>
                                                <Input
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={formData.founder_phone}
                                                    onChange={(e) => setFormData({ ...formData, founder_phone: e.target.value })}
                                                    className="h-11 bg-white border-border rounded-lg text-foreground"
                                                />
                                                <p className="text-[10px] text-muted-foreground">For admin support only. Never shared with investors.</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 3: The Pitch */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-foreground">Describe Your Vision *</Label>
                                            <Textarea
                                                placeholder="Describe your idea, the problem it solves, target market, competitive advantage, and your vision..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="min-h-[150px] bg-white border-border rounded-lg resize-none text-foreground"
                                                maxLength={2000}
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb className="w-3 h-3" />
                                                    Be concise & compelling (minimum 50 characters)
                                                </p>
                                                <p className="text-xs text-muted-foreground/50">{formData.description.length}/2000</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-foreground">
                                                Pitch Deck Link <span className="text-xs font-normal text-muted-foreground">(Google Drive)</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    placeholder="https://docs.google.com/presentation/d/..."
                                                    value={formData.drive_link}
                                                    onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                                                    className="h-11 bg-white border-border rounded-lg pr-10 text-foreground"
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
                                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                                                    LinkedIn <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="linkedin.com/in/..."
                                                    value={formData.linkedin_url}
                                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                                    className="h-11 bg-white border-border rounded-lg text-foreground"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                                    Website <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                                                </Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={formData.website_url}
                                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                                    className="h-11 bg-white border-border rounded-lg text-foreground"
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
                                            className="flex-1 h-11 rounded-lg border-border text-foreground"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                                        </Button>
                                    )}
                                    {currentStep < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg"
                                        >
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Logo size="sm" className="mr-2" /> Submit Idea
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

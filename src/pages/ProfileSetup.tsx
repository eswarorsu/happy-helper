import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, User, Mail, Phone, GraduationCap, Linkedin, MapPin,
  Building, Calendar, CreditCard, Award, ChevronRight, Upload, Loader2, Receipt,
  Target, ShieldCheck, Check, LogOut, Globe, Building2
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_OPTIONS = ["Student", "Final Year Student", "Graduate", "Working Professional"];

const founderSchema = z.object({
  name: z.string().min(2, "Name is required"),
  status: z.string().min(1, "Current status is required"),
  currentJob: z.string().optional(),
  experience: z.string().min(20, "Please provide more detail about your experience"),
  education: z.string().min(2, "Education is required"),
  domain: z.string().min(2, "Domain is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Phone number is required"),
  linkedinProfile: z.string().url("Valid LinkedIn URL is required").min(1, "LinkedIn profile is mandatory"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const investorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Phone number is required"),
  dob: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  city: z.string().min(2, "City is required"),
  investorType: z.string().min(1, "Investor type is required"),
  investingExperience: z.string().min(1, "Experience is required"),
  currentDesignation: z.string().optional(),
  organization: z.string().optional(),
  linkedinProfile: z.string().url("Valid LinkedIn URL is required"),
  professionalBio: z.string().min(20, "Please provide more detail about yourself"),
  investmentRange: z.string().min(1, "Investment range is required"),
  preferredStage: z.string().min(1, "Preferred stage is required"),
  interestedDomains: z.string().min(2, "Interested domains required"),
  previousInvestments: z.string().optional(),
  roiTimeline: z.string().min(1, "ROI timeline is required"),
  panLast4: z.string().optional(),
  isAccredited: z.boolean().optional(),
});


// --- INVESTOR FLOW CONSTANTS ---
const investorSteps = [
  { id: 1, label: "Personal Identity", icon: User },
  { id: 2, label: "Professional Background", icon: Briefcase },
  { id: 3, label: "Investment Profile", icon: Target },
  { id: 4, label: "Verification", icon: ShieldCheck }
];

const INVESTOR_TYPES = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capitalist" },
  { value: "individual", label: "Individual Investor" },
  { value: "family_office", label: "Family Office" },
  { value: "hni", label: "High Net Worth Individual" }
];

const INVESTMENT_RANGES = [
  { value: "1L-10L", label: "₹1 Lakh - ₹10 Lakhs" },
  { value: "10L-50L", label: "₹10 Lakhs - ₹50 Lakhs" },
  { value: "50L-1Cr", label: "₹50 Lakhs - ₹1 Crore" },
  { value: "1Cr-5Cr", label: "₹1 Crore - ₹5 Crores" },
  { value: "5Cr+", label: "₹5 Crores+" }
];

const PREFERRED_STAGES = ["Pre-Seed", "Seed", "Series A", "Growth", "Late Stage"];
const DOMAINS = ["AI/ML", "Fintech", "HealthTech", "EdTech", "SaaS", "E-commerce", "CleanTech", "AgriTech", "Web3", "Gaming", "Other"];
const ROI_TIMELINES = [
  { value: "1-3years", label: "1-3 Years" },
  { value: "3-5years", label: "3-5 Years" },
  { value: "5+years", label: "5+ Years" }
];

const ProfileSetup = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "founder" | "investor";
  const mode = searchParams.get("mode");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",

    // Founder fields
    status: "",
    currentJob: "",
    experience: "",
    education: "",
    domain: "",
    linkedinProfile: "",
    website: "",
    upiId: "",

    // Investor fields
    dob: "",
    nationality: "",
    city: "",
    investorType: "",
    investingExperience: "",
    currentDesignation: "",
    organization: "",
    professionalBio: "",
    investmentRange: "",
    preferredStage: "",
    interestedDomains: "",
    previousInvestments: "",
    roiTimeline: "",
    panLast4: "",
    isAccredited: false,

    // Legacy
    investmentCapital: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth?mode=register");
        return;
      }

      console.log("🔍 ProfileSetup: Checking for existing profile...", session.user.id);

      // ✅ CHECK IF PROFILE ALREADY EXISTS
      const { data: existingProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single() as { data: any, error: any };

      if (existingProfile) {
        if (mode === "edit") {
          // Pre-fill form for editing
          setUserId(session.user.id);
          setFormData(prev => ({
            ...prev,
            name: existingProfile.name || "",
            email: existingProfile.email || "",
            phone: existingProfile.phone || "",
            avatarUrl: existingProfile.avatar_url || "",

            // Founder
            status: existingProfile.current_status || "",
            currentJob: existingProfile.current_job || "",
            experience: existingProfile.experience || "",
            education: existingProfile.education || "",
            domain: existingProfile.domain || "",
            linkedinProfile: existingProfile.linkedin_profile || "",
            website: existingProfile.website_url || "",
            upiId: existingProfile.upi_id || "",

            // Investor
            dob: existingProfile.date_of_birth || "", // Fix: Use correct DB column names if different
            nationality: existingProfile.nationality || "",
            city: existingProfile.city || "",
            investorType: existingProfile.investor_type || "",
            investingExperience: existingProfile.investing_experience?.toString() || "",
            currentDesignation: existingProfile.current_designation || "",
            organization: existingProfile.organization || "",
            professionalBio: existingProfile.professional_bio || "",
            investmentRange: existingProfile.investment_range || "",
            preferredStage: existingProfile.preferred_stage ? existingProfile.preferred_stage.join(", ") : "",
            interestedDomains: existingProfile.interested_domains ? existingProfile.interested_domains.join(", ") : "",
            previousInvestments: existingProfile.previous_investments || "",
            roiTimeline: existingProfile.roi_timeline || "",
            panLast4: existingProfile.pan_last4 || "",
            isAccredited: existingProfile.is_accredited || false,
          }));

          // Skip to relevant step based on completion or just start at 1
          return;
        }

        // Profile exists and not in edit mode - redirect
        console.log("✅ ProfileSetup: Profile found, redirecting...");
        toast({ title: "Profile found!", description: "Redirecting to your dashboard..." });
        navigate(existingProfile.user_type === "founder" ? "/founder-dashboard" : "/investor-dashboard");
        return;
      }

      console.log("⚠️ ProfileSetup: No profile found, showing form...");
      // No profile exists - proceed with setup
      setUserId(session.user.id);
      const metadata = session.user.user_metadata;
      setFormData((prev) => ({
        ...prev,
        name: metadata?.name || "",
        email: session.user.email || "",
      }));
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, mode]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (userType === "founder") {
      if (currentStep === 1) {
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.status) newErrors.status = "Status is required";
        // Avatar optional
      } else if (currentStep === 2) {
        if (!formData.education) newErrors.education = "Education is required";
        if (formData.experience.length < 20) newErrors.experience = "Please describe your experience (min 20 chars)";
        if (!formData.domain) newErrors.domain = "Domain is required";
      } else if (currentStep === 3) {
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.phone) newErrors.phone = "Phone is required";
        if (!formData.linkedinProfile) newErrors.linkedinProfile = "LinkedIn is mandatory";
        else {
          try { z.string().url().parse(formData.linkedinProfile); }
          catch { newErrors.linkedinProfile = "Invalid URL"; }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userId) return;

    if (userType === 'founder' && !validateStep(3)) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Final Zod Validation just in case
      if (userType === "founder") {
        founderSchema.parse(formData);
      } else {
        investorSchema.parse(formData); // Basic schema for investor
      }

      const profileData: any = {
        user_id: userId,
        user_type: userType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar_url: formData.avatarUrl || null
      };

      if (userType === "founder") {
        profileData.education = formData.education;
        profileData.current_status = formData.status;
        profileData.current_job = formData.currentJob;
        profileData.experience = formData.experience;
        profileData.domain = formData.domain;
        profileData.linkedin_profile = formData.linkedinProfile;
        profileData.website_url = formData.website || null;
        profileData.upi_id = formData.upiId || null;
      } else {
        // Enhanced investor profile data
        profileData.upi_id = formData.upiId || null; // Ensure investors also save UPI ID
        profileData.date_of_birth = formData.dob || null;
        profileData.nationality = formData.nationality;
        profileData.city = formData.city;
        profileData.investor_type = formData.investorType;
        profileData.investing_experience = parseInt(formData.investingExperience) || 0;
        profileData.current_designation = formData.currentDesignation || null;
        profileData.organization = formData.organization || null;
        profileData.linkedin_profile = formData.linkedinProfile;
        profileData.professional_bio = formData.professionalBio;
        profileData.investment_range = formData.investmentRange;
        profileData.preferred_stage = formData.preferredStage.split(",").map((s: string) => s.trim());
        profileData.interested_domains = formData.interestedDomains.split(",").map((d: string) => d.trim());
        profileData.previous_investments = formData.previousInvestments || null;
        profileData.roi_timeline = formData.roiTimeline;
        profileData.pan_last4 = formData.panLast4 || null;
        profileData.is_accredited = formData.isAccredited;
        // Legacy field for backward compatibility
        profileData.investment_capital = formData.investmentRange === "1L-10L" ? 500000 :
          formData.investmentRange === "10L-50L" ? 3000000 :
            formData.investmentRange === "50L-1Cr" ? 7500000 :
              formData.investmentRange === "1Cr-5Cr" ? 30000000 : 100000000;
      }

      const { error } = await supabase.from("profiles").upsert(profileData, { onConflict: 'user_id' });
      if (error) throw error;

      toast({ title: mode === 'edit' ? "Profile updated!" : "Profile created!", description: mode === 'edit' ? "Your changes have been saved." : "Welcome to INNOVESTOR" });

      // If editing, go back to profile view
      if (mode === 'edit') {
        navigate("/profile");
      } else {
        navigate(userType === "founder" ? "/founder-dashboard" : "/investor-dashboard");
      }
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        if (error.message?.includes("JWT expired")) {
          toast({ title: "Session Expired", description: "Please login again.", variant: "destructive" });
          navigate("/auth");
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType) return null;

  // --- FOUNDER FLOW (Sidebar Layout) ---
  if (userType === "founder") {
    const steps = [
      { id: 1, label: "Basic Details" },
      { id: 2, label: "Professional Info" },
      { id: 3, label: "Contact & Socials" }
    ];

    return (
      <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-brand-yellow/20 selection:text-brand-charcoal">
        {/* Sidebar - Light Theme */}
        <div className="hidden lg:flex w-80 bg-brand-yellow text-brand-charcoal border-r border-border/60 flex-col justify-between fixed h-full z-20">
          <div className="p-8">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{mode === 'edit' ? 'Edit Profile' : 'Onboarding'}</h2>
            <h1 className="text-2xl font-black text-foreground mb-10">{mode === 'edit' ? 'Update Details' : 'Founder Profile'}</h1>

            <div className="space-y-6 relative">
              {/* Connecting Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60 z-0"></div>

              {steps.map((s) => {
                const isActive = step === s.id;
                const isCompleted = s.id < step;
                return (
                  <div key={s.id} className="relative z-10 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-all ${isActive ? 'bg-brand-yellow text-brand-charcoal shadow-lg shadow-brand-yellow/30 scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <div className={`transition-colors ${isActive ? 'text-brand-charcoal font-bold' : 'text-slate-500 font-medium'}`}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 border-t border-border/60">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => navigate("/auth?mode=login")}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-12 pt-8 sm:pt-12 lg:pt-20">
            {/* Mobile Progress */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">Step {step} of 3</span>
                <span className="text-xs text-muted-foreground">{steps[step - 1].label}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-brand-yellow transition-all duration-500 rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden text-slate-900">
              <div className="hidden lg:block p-1 h-1 bg-secondary/50">
                <div className="h-full bg-brand-yellow transition-all duration-500 ease-out rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
              </div>

              <div className="p-5 sm:p-8 lg:p-12 min-h-[500px] flex flex-col justify-between">
                {/* --- STEP CONTENT --- */}
                {step === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                      <h2 className="text-2xl font-black text-foreground">Let's start with the basics</h2>
                      <p className="text-muted-foreground mt-2">Tell us a bit about yourself.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-slate-50">
                          <AvatarImage src={formData.avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-slate-100 text-slate-400 text-2xl font-bold">
                            {formData.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-2">Profile Photo <span className="text-slate-400 font-normal">(Optional)</span></p>
                          <Button variant="outline" size="sm" onClick={() => handleInputChange("avatarUrl", `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)}>
                            Generate Random
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Full Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.name ? 'border-destructive' : ''}`}
                          placeholder="e.g. John Doe"
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Current Status</Label>
                        <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Student" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Professional Info</h2>
                      <p className="text-slate-500 mt-2">Your experience matters.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Current Job / Role</Label>
                          <Input value={formData.currentJob} onChange={(e) => handleInputChange("currentJob", e.target.value)} className="h-12 bg-slate-50" placeholder="e.g. Founder" />
                        </div>
                        <div className="space-y-2">
                          <Label>Education</Label>
                          <Input value={formData.education} onChange={(e) => handleInputChange("education", e.target.value)} className="h-12 bg-slate-50" placeholder="University" />
                          {errors.education && <p className="text-sm text-destructive">{errors.education}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Primary Domain</Label>
                        <Input value={formData.domain} onChange={(e) => handleInputChange("domain", e.target.value)} className="h-12 bg-slate-50" placeholder="e.g. Fintech" />
                        {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">UPI ID <span className="text-slate-400 font-normal">(For receiving investments)</span></Label>
                        <Input
                          value={formData.upiId}
                          onChange={(e) => handleInputChange("upiId", e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                          placeholder="e.g. founder@upi"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label>About You (Experience)</Label>
                        <Textarea value={formData.experience} onChange={(e) => handleInputChange("experience", e.target.value)} className="min-h-[120px] bg-slate-50 p-4" placeholder="Briefly describe your journey..." />
                        {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Contact & Socials</h2>
                      <p className="text-slate-500 mt-2">Connect with investors.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={formData.email} disabled className="h-12 bg-slate-100 text-slate-500" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="h-12 bg-slate-50" placeholder="+1..." />
                          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>LinkedIn Profile <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                          <Input value={formData.linkedinProfile} onChange={(e) => handleInputChange("linkedinProfile", e.target.value)} className="h-12 pl-12 bg-slate-50" placeholder="https://linkedin.com/in/..." />
                        </div>
                        {errors.linkedinProfile && <p className="text-sm text-destructive">{errors.linkedinProfile}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Website (Optional)</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} className="h-12 pl-12 bg-slate-50" placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- FOOTER --- */}
                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-border/30">
                  {step > 1 && (
                    <Button variant="ghost" onClick={() => setStep(prev => prev - 1)} className="text-muted-foreground hover:text-foreground">
                      ← Back
                    </Button>
                  )}
                  <Button
                    onClick={step === 3 ? handleSubmit : handleNext}
                    variant="gradient"
                    className="h-12 px-8 font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : step === 3 ? (mode === 'edit' ? "Save Changes" : "Complete") : "Continue"}
                    {!isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  const validateInvestorStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
      if (!formData.nationality) newErrors.nationality = "Nationality is required";
      if (!formData.city) newErrors.city = "City is required";
    } else if (currentStep === 2) {
      if (!formData.investorType) newErrors.investorType = "Investor type is required";
      if (!formData.investingExperience) newErrors.investingExperience = "Experience is required";
      if (!formData.linkedinProfile) newErrors.linkedinProfile = "LinkedIn is required";
      if (formData.professionalBio.length < 20) newErrors.professionalBio = "Please provide more detail (min 20 chars)";
    } else if (currentStep === 3) {
      if (!formData.investmentRange) newErrors.investmentRange = "Investment range is required";
      if (!formData.preferredStage) newErrors.preferredStage = "Preferred stage is required";
      if (!formData.interestedDomains) newErrors.interestedDomains = "Interested domains required";
      if (!formData.roiTimeline) newErrors.roiTimeline = "ROI timeline is required";
    } else if (currentStep === 4) {
      if (!formData.phone) newErrors.phone = "Phone number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleInvestorNext = () => {
    if (validateInvestorStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleInvestorSubmit = async () => {
    if (!validateInvestorStep(4)) return;
    await handleSubmit();
  };



  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-brand-yellow/20 selection:text-brand-charcoal">
      {/* Sidebar - Light Theme */}
      <div className="hidden lg:flex w-80 bg-brand-yellow text-brand-charcoal border-r border-border/60 flex-col justify-between fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <Logo size="sm" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Onboarding</h2>
          </div>
          <h1 className="text-2xl font-black text-foreground mb-10">Investor Profile</h1>

          <div className="space-y-6 relative">
            {/* Connecting Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60 z-0"></div>

            {investorSteps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = s.id < step;
              return (
                <div key={s.id} className="relative z-10 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-all ${isActive
                    ? 'bg-brand-yellow text-brand-charcoal shadow-lg shadow-brand-yellow/30 scale-110'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                    }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`transition-colors ${isActive ? 'text-brand-charcoal font-bold' : 'text-slate-500 font-medium'}`}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-border/60">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/40">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-700">Secure & Private</p>
              <p className="text-[10px] text-slate-500">Encrypted data storage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-12 pt-8 sm:pt-12 lg:pt-20">

          {/* Mobile Progress */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">Step {step} of 4</span>
              <span className="text-xs text-muted-foreground">{investorSteps[step - 1].label}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-yellow transition-all duration-500 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden text-slate-900">
            <div className="hidden lg:block p-1 h-1 bg-secondary/50">
              <div className="h-full bg-brand-yellow transition-all duration-500 ease-out rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
            </div>

            <div className="p-5 sm:p-8 lg:p-12 min-h-[550px] flex flex-col">

              {/* STEP 1: Personal Identity */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Let's verify your identity</h2>
                    <p className="text-slate-500 mt-2">Basic details to establish trust with founders.</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 border-4 border-slate-50">
                      <AvatarImage src={formData.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-400 text-2xl font-bold">
                        {formData.name?.charAt(0) || "I"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-2">Profile Photo <span className="text-slate-400 font-normal">(Optional)</span></p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange("avatarUrl", `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Generate Avatar
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Full Legal Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.name ? 'border-destructive' : ''}`}
                        placeholder="As per government ID"
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleInputChange("dob", e.target.value)}
                        className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.dob ? 'border-destructive' : ''}`}
                      />
                      {errors.dob && <p className="text-sm text-destructive">{errors.dob}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Nationality <span className="text-red-500">*</span></Label>
                      <Select value={formData.nationality} onValueChange={(v) => handleInputChange("nationality", v)}>
                        <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.nationality ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">🇮🇳 India</SelectItem>
                          <SelectItem value="USA">🇺🇸 United States</SelectItem>
                          <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                          <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                          <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.nationality && <p className="text-sm text-destructive">{errors.nationality}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">City <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.city ? 'border-destructive' : ''}`}
                        placeholder="e.g. Mumbai, Bangalore"
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Background */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Your professional background</h2>
                    <p className="text-slate-500 mt-2">Help founders understand your expertise.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Add UPI ID for Investors */}
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">UPI ID <span className="text-slate-400 font-normal">(For receiving returns)</span></Label>
                      <div className="relative">
                        <Receipt className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          value={formData.upiId}
                          onChange={(e) => handleInputChange("upiId", e.target.value)}
                          className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                          placeholder="username@upi"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Investor Type <span className="text-red-500">*</span></Label>
                      <Select value={formData.investorType} onValueChange={(v) => handleInputChange("investorType", v)}>
                        <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investorType ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {INVESTOR_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.investorType && <p className="text-sm text-destructive">{errors.investorType}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Years of Experience <span className="text-red-500">*</span></Label>
                      <Select value={formData.investingExperience} onValueChange={(v) => handleInputChange("investingExperience", v)}>
                        <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investingExperience ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Less than 1 year</SelectItem>
                          <SelectItem value="2">1-3 years</SelectItem>
                          <SelectItem value="5">3-5 years</SelectItem>
                          <SelectItem value="8">5-10 years</SelectItem>
                          <SelectItem value="15">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.investingExperience && <p className="text-sm text-destructive">{errors.investingExperience}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Current Designation</Label>
                      <Input
                        value={formData.currentDesignation}
                        onChange={(e) => handleInputChange("currentDesignation", e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                        placeholder="e.g. Managing Partner"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Organization / Firm</Label>
                      <Input
                        value={formData.organization}
                        onChange={(e) => handleInputChange("organization", e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                        placeholder="e.g. Sequoia Capital"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn Profile <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.linkedinProfile}
                      onChange={(e) => handleInputChange("linkedinProfile", e.target.value)}
                      className={`h-12 pl-4 bg-slate-50 border-slate-200 focus:bg-white ${errors.linkedinProfile ? 'border-destructive' : ''}`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                    {errors.linkedinProfile && <p className="text-sm text-destructive">{errors.linkedinProfile}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Professional Bio <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={formData.professionalBio}
                      onChange={(e) => handleInputChange("professionalBio", e.target.value)}
                      className={`min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white p-4 ${errors.professionalBio ? 'border-destructive' : ''}`}
                      placeholder="Brief background about your investment philosophy and experience..."
                    />
                    {errors.professionalBio && <p className="text-sm text-destructive">{errors.professionalBio}</p>}
                  </div>
                </div>
              )}

              {/* STEP 3: Investment Profile */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Investment preferences</h2>
                    <p className="text-slate-500 mt-2">Help us match you with the right startups.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Investment Range <span className="text-red-500">*</span></Label>
                      <Select value={formData.investmentRange} onValueChange={(v) => handleInputChange("investmentRange", v)}>
                        <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investmentRange ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_RANGES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.investmentRange && <p className="text-sm text-destructive">{errors.investmentRange}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Expected ROI Timeline <span className="text-red-500">*</span></Label>
                      <Select value={formData.roiTimeline} onValueChange={(v) => handleInputChange("roiTimeline", v)}>
                        <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.roiTimeline ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROI_TIMELINES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.roiTimeline && <p className="text-sm text-destructive">{errors.roiTimeline}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Preferred Investment Stage <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {PREFERRED_STAGES.map(stage => {
                        const isSelected = formData.preferredStage.split(",").map(s => s.trim()).includes(stage);
                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => {
                              const current = formData.preferredStage.split(",").map(s => s.trim()).filter(Boolean);
                              const updated = isSelected
                                ? current.filter(s => s !== stage)
                                : [...current, stage];
                              handleInputChange("preferredStage", updated.join(", "));
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${isSelected
                              ? 'bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/20'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                          >
                            {stage}
                          </button>
                        );
                      })}
                    </div>
                    {errors.preferredStage && <p className="text-sm text-destructive">{errors.preferredStage}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Interested Domains <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {DOMAINS.map(domain => {
                        const isSelected = formData.interestedDomains.split(",").map(s => s.trim()).includes(domain);
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => {
                              const current = formData.interestedDomains.split(",").map(s => s.trim()).filter(Boolean);
                              const updated = isSelected
                                ? current.filter(s => s !== domain)
                                : [...current, domain];
                              handleInputChange("interestedDomains", updated.join(", "));
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${isSelected
                              ? 'bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/20'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                          >
                            {domain}
                          </button>
                        );
                      })}
                    </div>
                    {errors.interestedDomains && <p className="text-sm text-destructive">{errors.interestedDomains}</p>}
                  </div>
                </div>
              )}

              {/* STEP 4: Verification */}
              {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Contact & Verification</h2>
                    <p className="text-slate-500 mt-2">Final details for secure communication.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Email</Label>
                      <Input
                        value={formData.email}
                        disabled
                        className="h-12 bg-slate-100 text-slate-500"
                      />
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3" /> Verified via authentication
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`h-12 bg-slate-50 border-slate-200 focus:bg-white ${errors.phone ? 'border-destructive' : ''}`}
                        placeholder="+91 98765 43210"
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">PAN Card (Last 4 digits - Optional)</Label>
                    <Input
                      value={formData.panLast4}
                      onChange={(e) => handleInputChange("panLast4", e.target.value.toUpperCase().slice(0, 4))}
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white w-40"
                      placeholder="XXXX"
                      maxLength={4}
                    />
                    <p className="text-xs text-slate-500">For KYC purposes (last 4 chars)</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAccredited}
                        onChange={(e) => handleInputChange("isAccredited", e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-charcoal focus:ring-brand-yellow"
                      />
                      <div>
                        <p className="font-bold text-slate-800">Accredited Investor Declaration</p>
                        <p className="text-sm text-slate-600 mt-1">
                          I declare that I meet the criteria of an accredited investor as per applicable regulations and have the financial capacity to make investment decisions.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-10 flex justify-between items-center pt-6 border-t border-border/30">
                {step > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setStep(prev => prev - 1)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  onClick={step === 4 ? handleInvestorSubmit : handleInvestorNext}
                  disabled={isLoading}
                  variant="gradient"
                  className="h-12 px-8 font-bold"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                      Creating Profile...
                    </>
                  ) : step === 4 ? (
                    <>
                      Complete Setup
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default ProfileSetup;

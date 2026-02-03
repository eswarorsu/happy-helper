import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket, Briefcase, User, Mail, Phone, GraduationCap, Building2, Linkedin, Globe, Target, LogOut, Upload, ChevronRight, Check
} from "lucide-react";
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
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  education: z.string().min(2),
  investmentCapital: z.string().min(1),
  interestedDomains: z.string().min(2),
});

const ProfileSetup = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "founder" | "investor";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    status: "",
    currentJob: "",
    experience: "",
    education: "",
    domain: "",
    email: "",
    phone: "",
    linkedinProfile: "",
    website: "",
    avatarUrl: "",
    dob: "", // Keep for legacy or hidden
    investmentCapital: "",
    interestedDomains: ""
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
        .single();

      console.log("📋 ProfileSetup: Query result:", { existingProfile, error });

      // Check for actual query errors (not "no rows found")
      if (error && error.code !== 'PGRST116') {
        console.error("❌ ProfileSetup: Query error:", error);
        toast({
          title: "Error checking profile",
          description: error.message,
          variant: "destructive"
        });
        // Still allow form to load in case of error
      }

      if (existingProfile) {
        // Profile exists - redirect to appropriate dashboard
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
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
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
        education: formData.education,
        avatar_url: formData.avatarUrl || null
      };

      if (userType === "founder") {
        profileData.current_status = formData.status;
        profileData.current_job = formData.currentJob;
        profileData.experience = formData.experience;
        profileData.domain = formData.domain;
        profileData.linkedin_profile = formData.linkedinProfile;
        profileData.website_url = formData.website || null;
      } else {
        profileData.investment_capital = parseFloat(formData.investmentCapital);
        profileData.interested_domains = formData.interestedDomains.split(",").map((d) => d.trim());
      }

      const { error } = await supabase.from("profiles").upsert(profileData, { onConflict: 'user_id' });
      if (error) throw error;

      toast({ title: "Profile created!", description: "Welcome to INNOVESTOR" });
      navigate(userType === "founder" ? "/founder-dashboard" : "/investor-dashboard");
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
      <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {/* Sidebar - Light Theme */}
        <div className="hidden lg:flex w-80 bg-white border-r border-slate-200 flex-col justify-between fixed h-full z-20">
          <div className="p-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Onboarding</h2>
            <h1 className="text-2xl font-black text-slate-900 mb-10">Founder Profile</h1>

            <div className="space-y-6 relative">
              {/* Connecting Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200 z-0"></div>

              {steps.map((s) => {
                const isActive = step === s.id;
                const isCompleted = s.id < step;
                return (
                  <div key={s.id} className="relative z-10 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <div className={`transition-colors ${isActive ? 'text-indigo-900 font-bold' : 'text-slate-500 font-medium'}`}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 border-t border-slate-100">
            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => navigate("/auth?mode=login")}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="max-w-3xl mx-auto p-6 lg:p-12 pt-12 lg:pt-20">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
              <div className="p-1 h-1 bg-slate-50">
                <div className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
              </div>

              <div className="p-8 lg:p-12 min-h-[500px] flex flex-col justify-between">
                {/* --- STEP CONTENT --- */}
                {step === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Let's start with the basics</h2>
                      <p className="text-slate-500 mt-2">Tell us a bit about yourself.</p>
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
                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-50">
                  {step > 1 && (
                    <Button variant="ghost" onClick={() => setStep(prev => prev - 1)} className="text-slate-500">
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={step === 3 ? handleSubmit : handleNext}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : step === 3 ? "Complete" : "Continue"}
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

  // --- INVESTOR FLOW (Unified Simple Flow) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Briefcase className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Investor Profile</h1>
          <p className="text-white/60">Join the network of visionary investors.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-12" placeholder="John Doe"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12" type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="h-12" placeholder="+1..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Investment Capital ($)</Label>
              <Input
                value={formData.investmentCapital} onChange={(e) => handleInputChange("investmentCapital", e.target.value)}
                className="h-12" type="number" placeholder="100,000"
              />
            </div>

            <div className="space-y-2">
              <Label>Interested Domains</Label>
              <Input
                value={formData.interestedDomains} onChange={(e) => handleInputChange("interestedDomains", e.target.value)}
                className="h-12" placeholder="AI, SaaS, Fintech..."
              />
            </div>

            <div className="space-y-2">
              <Label>Education / Background</Label>
              <Input
                value={formData.education} onChange={(e) => handleInputChange("education", e.target.value)}
                className="h-12" placeholder="University / Firm"
              />
            </div>

            <Button className="w-full h-14 text-lg font-bold bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? "Creating Profile..." : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;

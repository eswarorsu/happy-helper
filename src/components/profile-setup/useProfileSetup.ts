import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ProfileFormData, INITIAL_FORM_DATA, founderSchema, investorSchema } from "./types";

const DRAFT_STORAGE_KEY = "innovestor_profile_draft";

export function useProfileSetup() {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "founder" | "investor" | "choose";
  const mode = searchParams.get("mode");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── DRAFT PERSISTENCE ──────────────────────────────────────
  // Auto-save form data to localStorage so users don't lose progress on refresh
  useEffect(() => {
    if (!userId || mode === "edit") return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ formData, step, userType }));
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [formData, step, userId, userType, mode]);

  // Restore draft on mount
  useEffect(() => {
    if (mode === "edit") return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userType === userType && parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          if (parsed.step) setStep(parsed.step);
        }
      }
    } catch { /* ignore corrupted data */ }
  }, [userType, mode]);

  // ─── LOAD USER SESSION ──────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth?mode=register");
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single() as { data: any; error: any };

      if (existingProfile) {
        if (mode === "edit") {
          setUserId(session.user.id);
          const ctx = existingProfile.founder_context || {};
          setFormData(prev => ({
            ...prev,
            name: existingProfile.name || "",
            email: existingProfile.email || "",
            phone: existingProfile.phone || "",
            avatarUrl: existingProfile.avatar_url || "",
            status: existingProfile.current_status || "",
            currentJob: existingProfile.current_job || "",
            experience: existingProfile.experience || "",
            education: existingProfile.education || "",
            domain: existingProfile.domain || "",
            linkedinProfile: existingProfile.linkedin_profile || "",
            website: existingProfile.website_url || "",
            upiId: existingProfile.upi_id || "",
            companyName: ctx.company_name || "",
            teamSize: ctx.team_size || "",
            startupStage: ctx.startup_stage || "",
            discoverySource: ctx.discovery_source || "",
            primaryGoal: ctx.primary_goal || "",
            biggestChallenge: ctx.biggest_challenge || "",
            decisionTimeline: ctx.decision_timeline || "",
            fundingStatus: ctx.funding_status || "",
            dob: existingProfile.date_of_birth || "",
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
          return;
        }

        toast({ title: "Profile found!", description: "Redirecting to your dashboard..." });
        navigate(existingProfile.user_type === "founder" ? "/founder-dashboard" : "/investor-dashboard");
        return;
      }

      setUserId(session.user.id);
      const metadata = session.user.user_metadata;
      setFormData(prev => ({
        ...prev,
        name: metadata?.name || "",
        email: session.user.email || "",
      }));
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, mode]);

  // ─── FIELD HANDLERS ─────────────────────────────────────────
  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  // ─── FOUNDER VALIDATION ─────────────────────────────────────
  const validateFounderStep = useCallback((currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.status) newErrors.status = "Status is required";
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
    } else if (currentStep === 4) {
      if (!formData.startupStage) newErrors.startupStage = "Please select your startup stage";
      if (!formData.discoverySource) newErrors.discoverySource = "Please tell us how you heard about us";
      if (!formData.primaryGoal) newErrors.primaryGoal = "Please select your primary goal";
      if (!formData.biggestChallenge) newErrors.biggestChallenge = "Please select your biggest challenge";
      if (!formData.decisionTimeline) newErrors.decisionTimeline = "Please select a decision timeline";
      if (!formData.fundingStatus) newErrors.fundingStatus = "Please select your funding status";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  }, [formData]);

  // ─── INVESTOR VALIDATION ────────────────────────────────────
  const validateInvestorStep = useCallback((currentStep: number) => {
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
  }, [formData]);

  // ─── NAVIGATE STEPS ─────────────────────────────────────────
  const nextFounderStep = useCallback(() => {
    if (validateFounderStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [step, validateFounderStep]);

  const nextInvestorStep = useCallback(() => {
    if (validateInvestorStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [step, validateInvestorStep]);

  const prevStep = useCallback(() => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  }, []);

  // ─── SUBMIT ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!userId) return;

    if (userType === "founder" && !validateFounderStep(3)) return;
    if (userType === "investor" && !validateInvestorStep(4)) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (userType === "founder") {
        founderSchema.parse(formData);
      } else {
        investorSchema.parse(formData);
      }

      const profileData: any = {
        user_id: userId,
        user_type: userType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar_url: formData.avatarUrl || null,
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
        profileData.founder_context = {
          company_name: formData.companyName || null,
          team_size: formData.teamSize || null,
          startup_stage: formData.startupStage || null,
          discovery_source: formData.discoverySource || null,
          primary_goal: formData.primaryGoal || null,
          biggest_challenge: formData.biggestChallenge || null,
          decision_timeline: formData.decisionTimeline || null,
          funding_status: formData.fundingStatus || null,
        };
      } else {
        profileData.upi_id = formData.upiId || null;
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
        profileData.investment_capital = formData.investmentRange === "1L-10L" ? 500000 :
          formData.investmentRange === "10L-50L" ? 3000000 :
            formData.investmentRange === "50L-1Cr" ? 7500000 :
              formData.investmentRange === "1Cr-5Cr" ? 30000000 : 100000000;
      }

      const { error } = await supabase.from("profiles").upsert(profileData, { onConflict: 'user_id' });
      if (error) throw error;

      // Clear draft after successful save
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      toast({
        title: mode === "edit" ? "Profile updated!" : "Profile created!",
        description: mode === "edit" ? "Your changes have been saved." : "Welcome to INNOVESTOR",
      });

      if (mode === "edit") {
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
  }, [userId, userType, formData, mode, navigate, toast, validateFounderStep, validateInvestorStep]);

  return {
    userType,
    mode,
    step,
    formData,
    errors,
    isLoading,
    userId,
    setStep,
    handleInputChange,
    nextFounderStep,
    nextInvestorStep,
    prevStep,
    handleSubmit,
  };
}

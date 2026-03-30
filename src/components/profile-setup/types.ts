import { z } from "zod";

// ─── FORM DATA TYPE ─────────────────────────────────────────────
export interface ProfileFormData {
  // Common fields
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;

  // Founder fields
  status: string;
  currentJob: string;
  experience: string;
  education: string;
  domain: string;
  linkedinProfile: string;
  website: string;
  upiId: string;

  // Founder Step 4 — Startup Context
  companyName: string;
  teamSize: string;
  startupStage: string;
  discoverySource: string;
  primaryGoal: string;
  biggestChallenge: string;
  decisionTimeline: string;
  fundingStatus: string;

  // Investor fields
  dob: string;
  nationality: string;
  city: string;
  investorType: string;
  investingExperience: string;
  currentDesignation: string;
  organization: string;
  professionalBio: string;
  investmentRange: string;
  preferredStage: string;
  interestedDomains: string;
  previousInvestments: string;
  roiTimeline: string;
  panLast4: string;
  isAccredited: boolean;

  // Legacy
  investmentCapital: string;
}

export const INITIAL_FORM_DATA: ProfileFormData = {
  name: "",
  email: "",
  phone: "",
  avatarUrl: "",
  status: "",
  currentJob: "",
  experience: "",
  education: "",
  domain: "",
  linkedinProfile: "",
  website: "",
  upiId: "",
  companyName: "",
  teamSize: "",
  startupStage: "",
  discoverySource: "",
  primaryGoal: "",
  biggestChallenge: "",
  decisionTimeline: "",
  fundingStatus: "",
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
  investmentCapital: "",
};


// ─── ZOD SCHEMAS ────────────────────────────────────────────────
export const founderSchema = z.object({
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

export const investorSchema = z.object({
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

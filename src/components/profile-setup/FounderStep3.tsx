import { Mail, Phone, Linkedin, Globe, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Founder Step 3 — Contact & Socials (Email, Phone, LinkedIn, Website) */
const FounderStep3 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Contact & Socials</h2>
      <p className="text-slate-500 mt-1.5 text-sm">How investors can reach and verify you.</p>
    </div>

    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Email (Disabled — verified) */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input value={formData.email} disabled className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-400 rounded-xl cursor-not-allowed" />
          </div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Verified via authentication
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={formData.phone}
              onChange={(e) => onInputChange("phone", e.target.value)}
              className={`h-12 pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl ${errors.phone ? "border-red-400" : ""}`}
              placeholder="+91 98765 43210"
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500">⚠ {errors.phone}</p>}
        </div>
      </div>

      {/* LinkedIn */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          LinkedIn Profile <span className="text-amber-500">*</span>
        </Label>
        <div className="relative">
          <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
          <Input
            value={formData.linkedinProfile}
            onChange={(e) => onInputChange("linkedinProfile", e.target.value)}
            className={`h-12 pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 rounded-xl ${errors.linkedinProfile ? "border-red-400" : ""}`}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        {errors.linkedinProfile && <p className="text-xs text-red-500">⚠ {errors.linkedinProfile}</p>}
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Website <span className="text-slate-400 font-normal normal-case">(Optional)</span>
        </Label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={formData.website}
            onChange={(e) => onInputChange("website", e.target.value)}
            className="h-12 pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl"
            placeholder="https://yourstartup.com"
          />
        </div>
      </div>
    </div>
  </div>
);

export default FounderStep3;

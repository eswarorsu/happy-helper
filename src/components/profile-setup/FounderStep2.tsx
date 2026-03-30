import { Briefcase, GraduationCap, Building2, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Founder Step 2 — Professional Info (Job, Education, Domain, UPI, Experience) */
const FounderStep2 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Professional Info</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Help investors understand your background.</p>
    </div>

    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Current Job */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Job / Role</Label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={formData.currentJob}
              onChange={(e) => onInputChange("currentJob", e.target.value)}
              className="h-12 pl-10 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl"
              placeholder="e.g. Founder"
            />
          </div>
        </div>

        {/* Education */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Education</Label>
          <div className="relative">
            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={formData.education}
              onChange={(e) => onInputChange("education", e.target.value)}
              className={`h-12 pl-10 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl ${errors.education ? "border-red-400" : ""}`}
              placeholder="University or College"
            />
          </div>
          {errors.education && <p className="text-xs text-red-500">⚠ {errors.education}</p>}
        </div>
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Domain / Industry</Label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={formData.domain}
            onChange={(e) => onInputChange("domain", e.target.value)}
            className={`h-12 pl-10 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl ${errors.domain ? "border-red-400" : ""}`}
            placeholder="e.g. Fintech, EdTech, SaaS"
          />
        </div>
        {errors.domain && <p className="text-xs text-red-500">⚠ {errors.domain}</p>}
      </div>

      {/* UPI ID */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          UPI ID <span className="text-slate-400 font-normal normal-case">(For receiving investments)</span>
        </Label>
        <div className="relative">
          <Receipt className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={formData.upiId}
            onChange={(e) => onInputChange("upiId", e.target.value)}
            className="h-12 pl-10 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl transition-all"
            placeholder="e.g. yourname@okicici"
          />
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">About You / Experience</Label>
        <Textarea
          value={formData.experience}
          onChange={(e) => onInputChange("experience", e.target.value)}
          className={`min-h-[110px] bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl p-4 resize-none ${errors.experience ? "border-red-400" : ""}`}
          placeholder="Briefly describe your journey, skills, and what drives you as a founder..."
        />
        {errors.experience && <p className="text-xs text-red-500">⚠ {errors.experience}</p>}
      </div>
    </div>
  </div>
);

export default FounderStep2;

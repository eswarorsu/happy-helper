import { Linkedin, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVESTOR_TYPES } from "./constants";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Investor Step 2 — Professional Background */
const InvestorStep2 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Your professional background</h2>
      <p className="text-slate-500 mt-2">Help founders understand your expertise.</p>
    </div>

    {/* UPI ID */}
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">UPI ID <span className="text-slate-400 font-normal">(For receiving returns)</span></Label>
        <div className="relative">
          <Receipt className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={formData.upiId}
            onChange={(e) => onInputChange("upiId", e.target.value)}
            className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            placeholder="username@upi"
          />
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      {/* Investor Type */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Investor Type <span className="text-red-500">*</span></Label>
        <Select value={formData.investorType} onValueChange={(v) => onInputChange("investorType", v)}>
          <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investorType ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {INVESTOR_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.investorType && <p className="text-sm text-destructive">{errors.investorType}</p>}
      </div>

      {/* Years of Experience */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Years of Experience <span className="text-red-500">*</span></Label>
        <Select value={formData.investingExperience} onValueChange={(v) => onInputChange("investingExperience", v)}>
          <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investingExperience ? "border-destructive" : ""}`}>
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

      {/* Current Designation */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Current Designation</Label>
        <Input
          value={formData.currentDesignation}
          onChange={(e) => onInputChange("currentDesignation", e.target.value)}
          className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
          placeholder="e.g. Managing Partner"
        />
      </div>

      {/* Organization */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Organization / Firm</Label>
        <Input
          value={formData.organization}
          onChange={(e) => onInputChange("organization", e.target.value)}
          className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
          placeholder="e.g. Sequoia Capital"
        />
      </div>
    </div>

    {/* LinkedIn */}
    <div className="space-y-2">
      <Label className="font-bold text-slate-700 flex items-center gap-2">
        <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn Profile <span className="text-red-500">*</span>
      </Label>
      <Input
        value={formData.linkedinProfile}
        onChange={(e) => onInputChange("linkedinProfile", e.target.value)}
        className={`h-12 pl-4 bg-slate-50 border-slate-200 focus:bg-white ${errors.linkedinProfile ? "border-destructive" : ""}`}
        placeholder="https://linkedin.com/in/yourprofile"
      />
      {errors.linkedinProfile && <p className="text-sm text-destructive">{errors.linkedinProfile}</p>}
    </div>

    {/* Professional Bio */}
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">Professional Bio <span className="text-red-500">*</span></Label>
      <Textarea
        value={formData.professionalBio}
        onChange={(e) => onInputChange("professionalBio", e.target.value)}
        className={`min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white p-4 ${errors.professionalBio ? "border-destructive" : ""}`}
        placeholder="Brief background about your investment philosophy and experience..."
      />
      {errors.professionalBio && <p className="text-sm text-destructive">{errors.professionalBio}</p>}
    </div>
  </div>
);

export default InvestorStep2;

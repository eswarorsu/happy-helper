import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Investor Step 4 — Verification (Email, Phone, PAN, Accreditation) */
const InvestorStep4 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Contact & Verification</h2>
      <p className="text-slate-500 mt-2">Final details for secure communication.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      {/* Email (Verified) */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Email</Label>
        <Input value={formData.email} disabled className="h-12 bg-slate-100 text-slate-500" />
        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
          <Check className="w-3 h-3" /> Verified via authentication
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
        <Input
          value={formData.phone}
          onChange={(e) => onInputChange("phone", e.target.value)}
          className={`h-12 bg-slate-50 border-slate-200 focus:bg-white ${errors.phone ? "border-destructive" : ""}`}
          placeholder="+91 98765 43210"
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
      </div>
    </div>

    {/* PAN Card */}
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">PAN Card (Last 4 digits - Optional)</Label>
      <Input
        value={formData.panLast4}
        onChange={(e) => onInputChange("panLast4", e.target.value.toUpperCase().slice(0, 4))}
        className="h-12 bg-slate-50 border-slate-200 focus:bg-white w-40"
        placeholder="XXXX"
        maxLength={4}
      />
      <p className="text-xs text-slate-500">For KYC purposes (last 4 chars)</p>
    </div>

    {/* Accredited Investor Declaration */}
    <div className="p-4 sm:p-6 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30">
      <label className="flex items-start gap-4 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isAccredited}
          onChange={(e) => onInputChange("isAccredited", e.target.checked)}
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
);

export default InvestorStep4;

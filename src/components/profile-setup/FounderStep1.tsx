import { User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS } from "./constants";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Founder Step 1 — Basic Details (Name, Avatar, Status) */
const FounderStep1 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Let's start with the basics</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Tell us a bit about yourself to personalise your experience.</p>
    </div>

    <div className="space-y-4 sm:space-y-6">
      {/* Avatar Picker */}
      <div className="flex items-center gap-5 p-4 rounded-2xl border border-slate-100 bg-slate-50">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-brand-yellow/50 ring-offset-2 ring-offset-white">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-2xl font-black text-amber-600">{formData.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            )}
          </div>
          {formData.avatarUrl && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800 mb-1">
            Profile Photo <span className="text-slate-400 font-normal text-xs">(Optional)</span>
          </p>
          <p className="text-xs text-slate-400 mb-3">Generate a unique avatar or skip for now</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInputChange("avatarUrl", `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)}
            className="border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 text-xs"
          >
            ✨ Generate Avatar
          </Button>
          {formData.avatarUrl && (
            <button onClick={() => onInputChange("avatarUrl", "")} className="ml-2 text-xs text-slate-400 hover:text-red-500 transition-colors">
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            className={`h-12 pl-10 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all rounded-xl ${errors.name ? "border-red-400" : ""}`}
            placeholder="e.g. Chepuri Natraj"
          />
        </div>
        {errors.name && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.name}</p>}
      </div>

      {/* Current Status */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</Label>
        <Select value={formData.status} onValueChange={(v) => onInputChange("status", v)}>
          <SelectTrigger className="h-12 bg-white border-slate-200 text-slate-900 rounded-xl focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50">
            <SelectValue placeholder="Select your current status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-900">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="focus:bg-amber-50 focus:text-amber-700">{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && <p className="text-xs text-red-500">⚠ {errors.status}</p>}
      </div>
    </div>
  </div>
);

export default FounderStep1;

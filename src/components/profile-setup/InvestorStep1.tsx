import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Investor Step 1 — Personal Identity (Avatar, Name, DOB, Nationality, City) */
const InvestorStep1 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Let's verify your identity</h2>
      <p className="text-slate-500 mt-2">Basic details to establish trust with founders.</p>
    </div>

    {/* Avatar */}
    <div className="flex items-center gap-3 sm:gap-6">
      <Avatar className="w-24 h-24 border-4 border-slate-50">
        <AvatarImage src={formData.avatarUrl} className="object-cover" />
        <AvatarFallback className="bg-slate-100 text-slate-400 text-2xl font-bold">
          {formData.name?.charAt(0) || "I"}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">
          Profile Photo <span className="text-slate-400 font-normal">(Optional)</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onInputChange("avatarUrl", `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)}
        >
          <Upload className="w-4 h-4 mr-2" /> Generate Avatar
        </Button>
      </div>
    </div>

    {/* Form fields */}
    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Full Legal Name <span className="text-red-500">*</span></Label>
        <Input
          value={formData.name}
          onChange={(e) => onInputChange("name", e.target.value)}
          className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.name ? "border-destructive" : ""}`}
          placeholder="As per government ID"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></Label>
        <Input
          type="date"
          value={formData.dob}
          onChange={(e) => onInputChange("dob", e.target.value)}
          className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.dob ? "border-destructive" : ""}`}
        />
        {errors.dob && <p className="text-sm text-destructive">{errors.dob}</p>}
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Nationality <span className="text-red-500">*</span></Label>
        <Select value={formData.nationality} onValueChange={(v) => onInputChange("nationality", v)}>
          <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.nationality ? "border-destructive" : ""}`}>
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
          onChange={(e) => onInputChange("city", e.target.value)}
          className={`h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ${errors.city ? "border-destructive" : ""}`}
          placeholder="e.g. Mumbai, Bangalore"
        />
        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
      </div>
    </div>
  </div>
);

export default InvestorStep1;

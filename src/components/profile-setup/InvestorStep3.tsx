import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVESTMENT_RANGES, ROI_TIMELINES, PREFERRED_STAGES, DOMAINS } from "./constants";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Multi-select chip toggle for array-like fields stored as comma-separated strings */
const MultiChipSelector = ({
  options,
  value,
  field,
  onInputChange,
}: {
  options: string[];
  value: string;
  field: string;
  onInputChange: (field: string, value: string) => void;
}) => {
  const selected = value.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              const updated = isSelected ? selected.filter((s) => s !== opt) : [...selected, opt];
              onInputChange(field, updated.join(", "));
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isSelected
                ? "bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/20"
                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};

/** Investor Step 3 — Investment Profile (Range, ROI, Stages, Domains) */
const InvestorStep3 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Investment preferences</h2>
      <p className="text-slate-500 mt-2">Help us match you with the right startups.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      {/* Investment Range */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Investment Range <span className="text-red-500">*</span></Label>
        <Select value={formData.investmentRange} onValueChange={(v) => onInputChange("investmentRange", v)}>
          <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.investmentRange ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {INVESTMENT_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.investmentRange && <p className="text-sm text-destructive">{errors.investmentRange}</p>}
      </div>

      {/* ROI Timeline */}
      <div className="space-y-2">
        <Label className="font-bold text-slate-700">Expected ROI Timeline <span className="text-red-500">*</span></Label>
        <Select value={formData.roiTimeline} onValueChange={(v) => onInputChange("roiTimeline", v)}>
          <SelectTrigger className={`h-12 bg-slate-50 border-slate-200 ${errors.roiTimeline ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Select timeline" />
          </SelectTrigger>
          <SelectContent>
            {ROI_TIMELINES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.roiTimeline && <p className="text-sm text-destructive">{errors.roiTimeline}</p>}
      </div>
    </div>

    {/* Preferred Stage */}
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">Preferred Investment Stage <span className="text-red-500">*</span></Label>
      <MultiChipSelector options={PREFERRED_STAGES} value={formData.preferredStage} field="preferredStage" onInputChange={onInputChange} />
      {errors.preferredStage && <p className="text-sm text-destructive">{errors.preferredStage}</p>}
    </div>

    {/* Interested Domains */}
    <div className="space-y-2">
      <Label className="font-bold text-slate-700">Interested Domains <span className="text-red-500">*</span></Label>
      <MultiChipSelector options={DOMAINS} value={formData.interestedDomains} field="interestedDomains" onInputChange={onInputChange} />
      {errors.interestedDomains && <p className="text-sm text-destructive">{errors.interestedDomains}</p>}
    </div>
  </div>
);

export default InvestorStep3;

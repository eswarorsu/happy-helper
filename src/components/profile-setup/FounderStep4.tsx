import { Building, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STARTUP_STAGES, DISCOVERY_OPTIONS, PRIMARY_GOALS,
  BIGGEST_CHALLENGES, DECISION_TIMELINES, FUNDING_STATUS_OPTIONS,
} from "./constants";
import type { ProfileFormData } from "./types";

interface Props {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | boolean) => void;
}

/** Reusable chip selector for single-select options */
const ChipSelector = ({
  options,
  value,
  field,
  onInputChange,
}: {
  options: string[];
  value: string;
  field: string;
  onInputChange: (field: string, value: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onInputChange(field, opt)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
          value === opt
            ? "bg-brand-yellow text-brand-charcoal border-brand-yellow shadow-md shadow-brand-yellow/20"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

/** Founder Step 4 — Startup Context (stage, discovery, goals, challenges, timeline, funding) */
const FounderStep4 = ({ formData, errors, onInputChange }: Props) => (
  <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div>
      <h2 className="text-2xl font-black text-slate-900">Tell us about your startup</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Takes 60 seconds. You can update this anytime later.</p>
    </div>

    {/* Company Name + Team Size */}
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Building className="w-3.5 h-3.5" /> Company / Startup Name
        </Label>
        <Input
          value={formData.companyName}
          onChange={(e) => onInputChange("companyName", e.target.value)}
          className="h-12 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl"
          placeholder="e.g. Acme Corp"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> Team Size
        </Label>
        <Input
          type="number"
          min="1"
          value={formData.teamSize}
          onChange={(e) => onInputChange("teamSize", e.target.value)}
          className="h-12 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 rounded-xl"
          placeholder="e.g. 3"
        />
      </div>
    </div>

    {/* Startup Stage */}
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        What stage is your startup? <span className="text-red-500">*</span>
      </Label>
      <div className={`space-y-2 rounded-xl transition-all ${errors.startupStage ? "ring-1 ring-red-300 ring-offset-2" : ""}`}>
        {STARTUP_STAGES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onInputChange("startupStage", s.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              formData.startupStage === s.value
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className={`font-semibold text-sm ${formData.startupStage === s.value ? "text-amber-700" : "text-slate-800"}`}>{s.label}</p>
            <p className={`text-xs mt-0.5 ${formData.startupStage === s.value ? "text-amber-500" : "text-slate-400"}`}>{s.sub}</p>
          </button>
        ))}
      </div>
      {errors.startupStage && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.startupStage}</p>}
    </div>

    {/* How did you hear? */}
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        How did you hear about INNOVESTOR? <span className="text-red-500">*</span>
      </Label>
      <ChipSelector options={DISCOVERY_OPTIONS} value={formData.discoverySource} field="discoverySource" onInputChange={onInputChange} />
      {errors.discoverySource && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.discoverySource}</p>}
    </div>

    {/* Primary Goal */}
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        What is your primary goal right now? <span className="text-red-500">*</span>
      </Label>
      <ChipSelector options={PRIMARY_GOALS} value={formData.primaryGoal} field="primaryGoal" onInputChange={onInputChange} />
      {errors.primaryGoal && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.primaryGoal}</p>}
    </div>

    {/* Biggest Challenge */}
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        What is your biggest challenge today? <span className="text-red-500">*</span>
      </Label>
      <ChipSelector options={BIGGEST_CHALLENGES} value={formData.biggestChallenge} field="biggestChallenge" onInputChange={onInputChange} />
      {errors.biggestChallenge && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.biggestChallenge}</p>}
    </div>

    {/* Decision Timeline + Funding Status */}
    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Decision timeline</Label>
        <ChipSelector options={DECISION_TIMELINES} value={formData.decisionTimeline} field="decisionTimeline" onInputChange={onInputChange} />
      </div>
      <div className="space-y-3">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Funding status</Label>
        <ChipSelector options={FUNDING_STATUS_OPTIONS} value={formData.fundingStatus} field="fundingStatus" onInputChange={onInputChange} />
      </div>
    </div>
  </div>
);

export default FounderStep4;

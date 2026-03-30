import { Check, ShieldCheck } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { INVESTOR_STEPS } from "./constants";

interface InvestorSidebarProps {
  step: number;
}

/** Desktop sidebar for the Investor onboarding flow */
const InvestorSidebar = ({ step }: InvestorSidebarProps) => (
  <div className="hidden lg:flex w-80 bg-brand-yellow text-brand-charcoal border-r border-border/60 flex-col justify-between fixed h-full z-20">
    <div className="p-8">
      <div className="flex items-center gap-2 mb-2">
        <Logo size="sm" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Onboarding</h2>
      </div>
      <h1 className="text-2xl font-black text-foreground mb-10">Investor Profile</h1>

      <div className="space-y-4 sm:space-y-6 relative">
        {/* Connecting Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60 z-0" />

        {INVESTOR_STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = s.id < step;
          return (
            <div key={s.id} className="relative z-10 flex items-center gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-all ${
                  isActive
                    ? "bg-brand-yellow text-brand-charcoal shadow-lg shadow-brand-yellow/30 scale-110"
                    : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className={`transition-colors ${isActive ? "text-brand-charcoal font-bold" : "text-slate-500 font-medium"}`}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="p-8 border-t border-border/60">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/40">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-xs font-bold text-slate-700">Secure & Private</p>
          <p className="text-[10px] text-slate-500">Encrypted data storage</p>
        </div>
      </div>
    </div>
  </div>
);

export default InvestorSidebar;

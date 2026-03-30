import { Check, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { FOUNDER_STEPS } from "./constants";

interface FounderSidebarProps {
  step: number;
  mode: string | null;
}

/** Desktop sidebar for the Founder onboarding flow */
const FounderSidebar = ({ step, mode }: FounderSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex w-72 flex-col justify-between fixed h-full z-20 bg-white border-r border-slate-100">
      <div className="p-7">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-5 sm:mb-8">
          <Logo size="sm" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {mode === "edit" ? "Edit Profile" : "Onboarding"}
            </p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {mode === "edit" ? "Update Details" : "Founder Profile"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 sm:mb-8">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Progress</span>
            <span className="text-amber-600">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-yellow to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-1">
          {FOUNDER_STEPS.map((s) => {
            const isActive = step === s.id;
            const isCompleted = s.id < step;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-amber-50 border border-amber-200" : "border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                    isActive
                      ? "bg-brand-yellow text-brand-charcoal shadow-sm"
                      : isCompleted
                        ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isActive ? "text-amber-700" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-7 border-t border-slate-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500 font-medium hover:text-red-600 hover:bg-red-50 transition-all"
          onClick={() => navigate("/auth?mode=login")}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default FounderSidebar;

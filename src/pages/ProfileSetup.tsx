import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopilotAgentButton } from "@/components/CopilotAgentButton";
import {
  useProfileSetup,
  RoleSelection,
  FounderSidebar, FounderStep1, FounderStep2, FounderStep3, FounderStep4,
  InvestorSidebar, InvestorStep1, InvestorStep2, InvestorStep3, InvestorStep4,
  FOUNDER_STEPS, INVESTOR_STEPS,
} from "@/components/profile-setup";

const ProfileSetup = () => {
  const {
    userType, mode, step, formData, errors, isLoading,
    handleInputChange, nextFounderStep, nextInvestorStep, prevStep, handleSubmit,
  } = useProfileSetup();

  if (!userType) return null;

  // ─── ROLE SELECTION (Google Auth) ───────────────────────────
  if (userType === "choose") return <RoleSelection />;

  // ─── FOUNDER FLOW ───────────────────────────────────────────
  if (userType === "founder") {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-brand-yellow/20 selection:text-brand-charcoal">
        <FounderSidebar step={step} mode={mode} />

        <div className="flex-1 lg:ml-72">
          <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-10 pt-8 sm:pt-12 lg:pt-16">
            {/* Mobile Progress */}
            <div className="lg:hidden mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-800">Step {step} of 4</span>
                <span className="text-xs text-slate-400">{FOUNDER_STEPS[step - 1].label}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-yellow to-amber-400 transition-all duration-500 rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>

            {/* Desktop step label */}
            <div className="hidden lg:flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Step {step} of 4</span>
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">{FOUNDER_STEPS[step - 1].label}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-brand-yellow to-amber-400" />
              <div className="p-4 sm:p-6 sm:p-8 lg:p-10 min-h-[520px] flex flex-col justify-between">
                {/* Step Content */}
                {step === 1 && <FounderStep1 formData={formData} errors={errors} onInputChange={handleInputChange} />}
                {step === 2 && <FounderStep2 formData={formData} errors={errors} onInputChange={handleInputChange} />}
                {step === 3 && <FounderStep3 formData={formData} errors={errors} onInputChange={handleInputChange} />}
                {step === 4 && <FounderStep4 formData={formData} errors={errors} onInputChange={handleInputChange} />}

                {/* Footer */}
                <div className="mt-10 flex justify-between items-center pt-5 border-t border-slate-100">
                  {step > 1 ? (
                    <Button variant="ghost" onClick={prevStep} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      ← Back
                    </Button>
                  ) : <div />}
                  <Button
                    onClick={step === 4 ? handleSubmit : nextFounderStep}
                    disabled={isLoading}
                    className="h-11 px-8 font-bold text-sm bg-brand-yellow hover:bg-amber-400 text-brand-charcoal rounded-xl transition-all shadow-md shadow-amber-200 hover:shadow-amber-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                  >
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-brand-charcoal/30 border-t-brand-charcoal rounded-full animate-spin mr-2" />Saving…</>
                    ) : step === 4 ? (
                      <>{mode === "edit" ? "Save Changes" : "🎉 Complete Setup"}</>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── INVESTOR FLOW ──────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-brand-yellow/20 selection:text-brand-charcoal">
      <InvestorSidebar step={step} />

      <div className="flex-1 lg:ml-80">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-12 pt-8 sm:pt-12 lg:pt-20">
          {/* Mobile Progress */}
          <div className="lg:hidden mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">Step {step} of 4</span>
              <span className="text-xs text-muted-foreground">{INVESTOR_STEPS[step - 1].label}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-brand-yellow transition-all duration-500 rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden text-slate-900">
            <div className="hidden lg:block p-1 h-1 bg-secondary/50">
              <div className="h-full bg-brand-yellow transition-all duration-500 ease-out rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
            </div>

            <div className="p-5 sm:p-8 lg:p-12 min-h-[550px] flex flex-col">
              {/* Step Content */}
              {step === 1 && <InvestorStep1 formData={formData} errors={errors} onInputChange={handleInputChange} />}
              {step === 2 && <InvestorStep2 formData={formData} errors={errors} onInputChange={handleInputChange} />}
              {step === 3 && <InvestorStep3 formData={formData} errors={errors} onInputChange={handleInputChange} />}
              {step === 4 && <InvestorStep4 formData={formData} errors={errors} onInputChange={handleInputChange} />}

              {/* Footer */}
              <div className="mt-10 flex justify-between items-center pt-6 border-t border-border/30">
                {step > 1 ? (
                  <Button variant="ghost" onClick={prevStep} className="text-muted-foreground hover:text-foreground">
                    ← Back
                  </Button>
                ) : <div />}
                <Button
                  onClick={step === 4 ? handleSubmit : nextInvestorStep}
                  disabled={isLoading}
                  className="h-12 px-8 font-bold bg-brand-yellow hover:bg-amber-400 text-brand-charcoal rounded-xl shadow-md shadow-amber-200 hover:scale-[1.02] transition-all"
                >
                  {isLoading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />Creating Profile...</>
                  ) : step === 4 ? (
                    <>Complete Setup <Check className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Continue <ChevronRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CopilotAgentButton context="profile" />
    </div>
  );
};

export default ProfileSetup;

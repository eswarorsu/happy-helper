import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronRight, Target } from "lucide-react";
import Logo from "@/components/ui/Logo";

/** Full-screen role selection view for Google Auth users */
const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden font-sans selection:bg-brand-yellow/20 selection:text-brand-charcoal">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-400/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-charcoal/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <Logo size="sm" />
            <span className="text-xl font-bold tracking-tight">INNOVESTOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
            How will you use Innovestor?
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Please choose your primary intent for joining the platform. This will customize your entire dashboard experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-6 sm:gap-8 max-w-3xl mx-auto">
          {/* Founder Card */}
          <button
            onClick={() => navigate("/profile-setup?type=founder")}
            className="group text-left bg-white p-4 sm:p-6 sm:p-8 rounded-3xl border-2 border-slate-100 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-400/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 group-hover:bg-amber-400/10 rounded-bl-[100px] transition-colors" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">I am a Founder</h3>
            <p className="text-sm font-medium text-slate-500 mb-4 sm:mb-6">
              I am building a startup, looking for funding, mentorship, or to share my MVP.
            </p>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600">
              Continue as Founder <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Investor Card */}
          <button
            onClick={() => navigate("/profile-setup?type=investor")}
            className="group text-left bg-white p-4 sm:p-6 sm:p-8 rounded-3xl border-2 border-slate-100 hover:border-brand-charcoal hover:shadow-2xl hover:shadow-brand-charcoal/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 group-hover:bg-slate-200/50 rounded-bl-[100px] transition-colors" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">I am an Investor</h3>
            <p className="text-sm font-medium text-slate-500 mb-4 sm:mb-6">
              I am looking to discover, review, and invest in high-potential early-stage startups.
            </p>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 group-hover:text-brand-charcoal">
              Continue as Investor <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

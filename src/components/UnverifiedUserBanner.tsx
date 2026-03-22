import { motion } from "framer-motion";
import { Rocket, Bot, Newspaper, ArrowRight, Zap } from "lucide-react";

const COPILOT_URL = "https://innovestor-copilot.vercel.app/";

interface UnverifiedUserBannerProps {
    userName?: string;
}

export function UnverifiedUserBanner({ userName }: UnverifiedUserBannerProps) {
    const openCopilot = () => {
        window.open(COPILOT_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full mx-auto px-4 pb-6 mt-4"
        >
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-yellow/30 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-lg shadow-brand-yellow/10 p-6">
                {/* Animated background accent */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-yellow/10 blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-amber-200/20 blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

                {/* Header */}
                <div className="relative flex items-start gap-4 mb-5">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                        className="flex-shrink-0 w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center shadow-md shadow-brand-yellow/30"
                    >
                        <Rocket className="w-6 h-6 text-brand-charcoal" />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                                Verification Pending
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                            {userName ? `Stay sharp, ${userName.split(" ")[0]}!` : "Stay in the startup zone!"} 🚀
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Your application is under review. Use this time wisely — sharpen your strategy with AI.
                        </p>
                    </div>
                </div>

                {/* CTA Cards */}
                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card 1: Explore AI Copilot */}
                    <motion.button
                        onClick={openCopilot}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex items-start gap-3 bg-brand-yellow/90 hover:bg-brand-yellow text-brand-charcoal p-4 rounded-2xl text-left shadow-md shadow-brand-yellow/20 hover:shadow-lg hover:shadow-brand-yellow/30 transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex-shrink-0 w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">Explore AI Copilot</p>
                            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">
                                Discover startup news, pitch tips & AI coaching
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    {/* Card 2: Chat with AI about your idea */}
                    <motion.button
                        onClick={openCopilot}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex items-start gap-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-brand-yellow/50 text-slate-800 p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex-shrink-0 w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src="/logo.jpeg" alt="AI" className="w-full h-full object-cover scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">Chat With AI Copilot</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                Refine your startup idea before you go live
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 text-slate-400 group-hover:text-brand-yellow group-hover:translate-x-1 transition-all" />
                    </motion.button>
                </div>

                {/* Footer hint */}
                <div className="relative flex items-center gap-2 mt-4 pt-4 border-t border-amber-100">
                    <Zap className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
                    <p className="text-xs text-slate-400 font-medium">
                        <span className="text-slate-600 font-semibold">Execution over Ideas.</span> {" "}
                        While you wait, build your pitch, test your assumptions, and stay sharp.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

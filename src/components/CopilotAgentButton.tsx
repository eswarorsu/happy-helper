import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Rocket, MessageCircle, FileText, ShoppingCart, 
    Sparkles, Search, Store, Handshake, Wallet, UserCircle, Key 
} from "lucide-react";
import BotAvatar from "@/components/ui/BotAvatar";

type CopilotContext = "pitch" | "chatbox" | "weekly-log" | "product-launch" | "dashboard" | "landing" | "marketplace" | "product-marketplace" | "dealroom" | "transactions" | "profile" | "auth";

const CONTEXT_MESSAGES: Record<CopilotContext, React.ReactNode> = {
    "pitch": <span className="flex items-center gap-2">Struggling with your pitch? I can help! <Rocket className="w-4 h-4 text-amber-500" /></span>,
    "chatbox": <span className="flex items-center gap-2">Not sure what to say? Let me coach you! <MessageCircle className="w-4 h-4 text-amber-500" /></span>,
    "weekly-log": <span className="flex items-center gap-2">Need help documenting progress? Ask me! <FileText className="w-4 h-4 text-amber-500" /></span>,
    "product-launch": <span className="flex items-center gap-2">Let me help you position your product! <ShoppingCart className="w-4 h-4 text-amber-500" /></span>,
    "dashboard": (
        <span className="flex flex-col items-center">
            Hi, I'm Copilot!<br />
            <span className="flex items-center gap-1 mt-1">Ask me anything <Sparkles className="w-4 h-4 text-amber-500" /></span>
        </span>
    ),
    "landing": (
        <span className="flex flex-col items-center">
            Hi, I'm Copilot!<br />
            <span className="flex items-center gap-1 mt-1">Ask me anything <Sparkles className="w-4 h-4 text-amber-500" /></span>
        </span>
    ),
    "marketplace": <span className="flex items-center gap-2">Looking for the next unicorn? Let me help! <Search className="w-4 h-4 text-amber-500" /></span>,
    "product-marketplace": <span className="flex items-center gap-2">Want to find the best products? <Store className="w-4 h-4 text-amber-500" /></span>,
    "dealroom": <span className="flex items-center gap-2">Need help negotiating this deal? <Handshake className="w-4 h-4 text-amber-500" /></span>,
    "transactions": <span className="flex items-center gap-2">Want to analyze your investments? <Wallet className="w-4 h-4 text-amber-500" /></span>,
    "profile": <span className="flex items-center gap-2">Need help setting up your profile? <UserCircle className="w-4 h-4 text-amber-500" /></span>,
    "auth": <span className="flex items-center gap-2">Having trouble signing in? Let me help! <Key className="w-4 h-4 text-amber-500" /></span>,
};

const COPILOT_URL = "https://innovestor-copilot.vercel.app/";

interface CopilotAgentButtonProps {
    context?: CopilotContext;
    inline?: boolean;
    className?: string;
}

export function CopilotAgentButton({
    context = "dashboard",
    inline = false,
    className = "",
}: CopilotAgentButtonProps) {
    const [showBubble, setShowBubble] = useState(false);
    const message = CONTEXT_MESSAGES[context] || CONTEXT_MESSAGES["dashboard"];

    const handleClick = () => {
        window.open(COPILOT_URL, "_blank", "noopener,noreferrer");
    };

    if (inline) {
        return (
            <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`group flex items-center gap-2 bg-white border border-brand-yellow shadow-sm shadow-brand-yellow/10 rounded-full px-3 py-1.5 cursor-pointer transition-all hover:shadow-md hover:border-brand-yellow ${className}`}
                aria-label="Open AI Copilot"
                title="Open Innovestor Copilot"
            >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-900 border border-slate-700">
                    <BotAvatar className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">Ask Copilot <Sparkles className="w-3 h-3 text-amber-500" /></span>
            </motion.button>
        );
    }

    return (
        <div className={`fixed bottom-24 right-4 sm:bottom-10 sm:right-6 z-[100] flex flex-col items-end pointer-events-none ${className}`}>
            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3 pointer-events-auto mr-2"
                    >
                        <div
                            className="relative bg-white border border-slate-200 shadow-xl shadow-brand-yellow/5 rounded-[20px] rounded-br-[4px] px-5 py-3.5 cursor-pointer select-none"
                            onClick={handleClick}
                        >
                            <div className="text-sm font-bold text-brand-charcoal text-center leading-snug">
                                {message}
                            </div>
                            {/* Speech Bubble Tail */}
                            <div className="absolute -bottom-2 right-[10px] w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45 rounded-sm" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                onMouseEnter={() => setShowBubble(true)}
                onMouseLeave={() => setShowBubble(false)}
                // Smooth Bouncing animation for floating
                animate={{
                    y: [0, -8, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center p-0 overflow-hidden w-14 h-14 sm:w-16 sm:h-16 cursor-pointer pointer-events-auto group rounded-full shadow-lg hover:shadow-xl transition-all"
            >
                {/* Copilot icon */}
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <BotAvatar className="w-full h-full scale-110" />
                </div>
            </motion.button>
        </div>
    );
}

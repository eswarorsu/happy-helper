import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CopilotContext = "pitch" | "chatbox" | "weekly-log" | "product-launch" | "dashboard";

const CONTEXT_MESSAGES: Record<CopilotContext, string> = {
    "pitch": "Struggling with your pitch? I can help! 🚀",
    "chatbox": "Not sure what to say? Let me coach you! 💬",
    "weekly-log": "Need help documenting progress? Ask me! 📝",
    "product-launch": "Let me help you position your product! 🛒",
    "dashboard": "Ask me anything about startups! 🧠",
};

const COPILOT_URL = "https://innovestor-copilot.vercel.app/";

interface CopilotAgentButtonProps {
    context?: CopilotContext;
    /** If true, renders inline (e.g. inside a form) rather than fixed to bottom-right */
    inline?: boolean;
    className?: string;
}

export function CopilotAgentButton({
    context = "dashboard",
    inline = false,
    className = "",
}: CopilotAgentButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const message = CONTEXT_MESSAGES[context];

    const handleClick = () => {
        window.open(COPILOT_URL, "_blank", "noopener,noreferrer");
    };

    const buttonEl = (
        <motion.button
            onClick={handleClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className={`group flex items-center gap-2 bg-white border-2 border-brand-yellow shadow-lg shadow-brand-yellow/20 rounded-full px-3 py-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-brand-yellow/30 ${className}`}
            aria-label="Open AI Copilot"
            title="Open Innovestor Copilot"
        >
            {/* Pulse ring */}
            <span className="relative flex-shrink-0">
                <span className="absolute inset-0 rounded-full bg-brand-yellow/40 animate-ping" />
                <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-yellow overflow-hidden">
                    <img
                        src="/logo.jpeg"
                        alt="Innovestor AI"
                        className="w-full h-full object-cover scale-110"
                    />
                </span>
            </span>

            {/* Speech bubble text */}
            <AnimatePresence>
                <motion.div
                    key={isHovered ? "expanded" : "compact"}
                    className="flex items-center gap-1 text-left overflow-hidden"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                >
                    <span className="text-xs font-semibold text-slate-800 whitespace-nowrap pr-1">
                        {message}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* Static compact label (always shown) */}
            {!isHovered && (
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    💬 AI Help
                </span>
            )}
        </motion.button>
    );

    if (inline) {
        return buttonEl;
    }

    return (
        <div className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-6">
            {buttonEl}
        </div>
    );
}

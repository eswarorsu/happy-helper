import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, FileText, TrendingUp, Bot } from "lucide-react";

const COPILOT_URL = "https://innovestor-copilot.vercel.app/";

const QUESTIONS = [
    <span className="flex items-center gap-2" key="q1">Got a billion-dollar startup idea? <Sparkles className="w-4 h-4 text-amber-500" /></span>,
    <span className="flex items-center gap-2" key="q2">Want to refine your pitch? <Rocket className="w-4 h-4 text-amber-500" /></span>,
    <span className="flex items-center gap-2" key="q3">Need help writing a weekly log? <FileText className="w-4 h-4 text-amber-500" /></span>,
    <span className="flex items-center gap-2" key="q4">Curious about investor trends? <TrendingUp className="w-4 h-4 text-amber-500" /></span>
];

export function LandingCopilotWidget() {
    const [showQuestion, setShowQuestion] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);

    // Also cycle questions occasionally if hovered or periodically (optional)
    useEffect(() => {
        const interval = setInterval(() => {
            setQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
        }, 10000); // cycle questions every 10s in the background
        return () => clearInterval(interval);
    }, []);

    const handleClick = () => {
        window.open(COPILOT_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="fixed bottom-24 right-4 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {showQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="mb-3 mr-2 pointer-events-auto relative bg-white border border-slate-200 shadow-xl shadow-brand-yellow/5 rounded-[20px] rounded-br-[4px] px-5 py-3.5 cursor-pointer flex items-center justify-center origin-bottom-right"
                        onClick={handleClick}
                    >
                        <p className="text-sm font-bold text-brand-charcoal text-center leading-snug">
                            {QUESTIONS[questionIndex]}
                        </p>
                        {/* Speech Bubble Tail */}
                        <div className="absolute -bottom-2 right-[10px] w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45 rounded-sm" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                onHoverStart={() => setShowQuestion(true)}
                onHoverEnd={() => setShowQuestion(false)}
                // Bouncing animation
                animate={{
                    y: [0, -8, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative flex items-center justify-center p-0 overflow-hidden w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:shadow-xl cursor-pointer pointer-events-auto transition-all group"
            >
                {/* Copilot icon */}
                <img
                    src="/copilot-agent-icon.jpg"
                    alt="AI Copilot"
                    className="w-full h-full object-cover scale-110 mix-blend-multiply"
                />
            </motion.button>
        </div>
    );
}

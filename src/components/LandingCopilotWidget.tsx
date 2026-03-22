import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COPILOT_URL = "https://innovestor-copilot.vercel.app/";

const QUESTIONS = [
    "Got a billion-dollar startup idea? 💡",
    "Want to refine your pitch? 🚀",
    "Need help writing a weekly log? 📝",
    "Curious about investor trends? 📊"
];

export function LandingCopilotWidget() {
    const [showQuestion, setShowQuestion] = useState(true);
    const [questionIndex, setQuestionIndex] = useState(0);

    // Initial sequence: Show for 2 seconds, then disappear
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowQuestion(false);
        }, 3000); // 3 seconds total (1s entrance + 2s visibility)

        return () => clearTimeout(timer);
    }, []);

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
        <div className="fixed bottom-6 right-4 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {showQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="bg-white border-2 border-brand-yellow shadow-xl shadow-brand-yellow/20 rounded-2xl p-3 pr-4 flex items-center gap-3 origin-bottom-right pointer-events-auto cursor-pointer"
                        onClick={handleClick}
                    >
                        <div className="flex-shrink-0 w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">🤖</span>
                        </div>
                        <p className="text-sm font-semibold text-brand-charcoal">
                            {QUESTIONS[questionIndex]}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                onHoverStart={() => setShowQuestion(true)}
                onHoverEnd={() => setShowQuestion(false)}
                // Bouncing animation
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative flex items-center justify-center p-0 overflow-hidden bg-brand-yellow w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl shadow-brand-yellow/40 cursor-pointer pointer-events-auto border-4 border-white group"
            >
                {/* Glow ring */}
                <span className="absolute inset-0 rounded-full bg-brand-yellow mix-blend-overlay group-hover:animate-ping opacity-50" />
                
                {/* Copilot icon */}
                <img
                    src="/copilot-icon.jpg"
                    alt="AI Copilot"
                    className="w-full h-full object-cover scale-110"
                />
            </motion.button>
        </div>
    );
}

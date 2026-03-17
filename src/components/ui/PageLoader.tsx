import { motion } from "framer-motion";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

const PageLoader = ({ message = "Loading...", className = "min-h-[100dvh]" }: PageLoaderProps) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-background ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-yellow flex items-center justify-center overflow-hidden shadow-xl shadow-brand-yellow/20">
          <img src="/logo.jpeg" alt="Loading" className="w-full h-full object-cover scale-110" />
        </div>
      </motion.div>
      <div className="flex items-center gap-2 text-slate-500 font-medium">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        {message}
      </div>
    </div>
  );
};

export default PageLoader;

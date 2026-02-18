import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type EqualizerProps = {
  bars?: number;
  className?: string;
  maxHeight?: number; // px
};

export const Equalizer: React.FC<EqualizerProps> = ({ bars = 9, className, maxHeight = 36 }) => {
  const shouldReduceMotion = useReducedMotion();
  const baseDuration = 1.2;

  return (
    <div className={cn("flex items-end gap-2", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i % 4) * 0.08;
        const duration = baseDuration + ((i % 3) * 0.12);
        const keyframes = [0.25, 1, 0.4, 0.85, 0.3];

        return (
          <motion.span
            key={i}
            className="block origin-bottom rounded-sm bg-gradient-to-t from-brand-yellow/95 to-yellow-400 will-change-transform"
            style={{ width: 6, height: maxHeight, boxShadow: '0 8px 28px -10px rgba(250,204,21,0.45)' }}
            animate={shouldReduceMotion ? undefined : { scaleY: keyframes }}
            transition={
              shouldReduceMotion
                ? undefined
                : { duration, ease: "easeInOut", repeat: Infinity, repeatType: "loop", delay }
            }
          />
        );
      })}
    </div>
  );
};

export default Equalizer;

import { Badge } from "@/components/ui/badge";
import { Hourglass, Zap } from "lucide-react";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { motion, AnimatePresence } from "framer-motion";

export function ActivityTimerBadge({
    profileId,
    isApproved,
    multiplier = 1
}: {
    profileId?: string,
    isApproved?: boolean,
    multiplier?: number
}) {
    const { seconds, isIdle } = useActiveTimer(profileId, isApproved, multiplier);

    if (!isApproved) return null;

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
        >
            <div className="relative">
                <Badge
                    variant="outline"
                    className={`flex items-center gap-2.5 px-3 py-1.5 border-border bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-500 rounded-full ${isIdle
                        ? 'opacity-50 grayscale'
                        : 'border-indigo-100 ring-1 ring-indigo-50/30'
                        }`}
                >
                    <div className="flex items-center justify-center">
                        <Hourglass className={`w-3.5 h-3.5 transition-colors duration-500 ${isIdle ? 'text-slate-400' : 'text-foreground'}`} />
                    </div>

                    <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                           user Platform Age
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground tabular-nums">
                                {formatTime(seconds)}
                            </span>
                            {!isIdle && multiplier > 1 && (
                                <div className="flex items-center px-1 py-0.5 bg-indigo-50 text-[8px] font-black text-indigo-600 rounded-full border border-indigo-100/50">
                                    <Zap className="w-2 h-2 mr-0.5 fill-current" />
                                    {multiplier}x
                                </div>
                            )}
                        </div>
                    </div>
                </Badge>

                {/* Status Dot */}
                <AnimatePresence>
                    {!isIdle && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5"
                        >
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

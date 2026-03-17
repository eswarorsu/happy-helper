import { useNavigate, useLocation } from "react-router-dom";
import {
    Home, Receipt, User, MessageSquare, Rocket, Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileNavProps {
    userType?: "founder" | "investor";
    userName?: string;
    onLogout?: () => void;
    unreadCount?: number;
    onMessagesClick?: () => void;
}

const MobileNav = ({ userType, unreadCount = 0, onMessagesClick }: MobileNavProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isFounder = userType === "founder";

    const navItems = [
        {
            label: "Home",
            icon: Home,
            path: isFounder ? "/founder-dashboard" : "/investor-dashboard",
        },
        {
            label: "Messages",
            icon: MessageSquare,
            onClick: onMessagesClick,
            badge: unreadCount,
        },
        {
            label: isFounder ? "Launch" : "Explore",
            icon: isFounder ? Rocket : Store,
            path: isFounder ? "/payment" : "/marketplace",
            isCentral: true,
        },
        {
            label: "Txns",
            icon: Receipt,
            path: "/transactions",
        },
        {
            label: "Profile",
            icon: User,
            path: "/profile",
        },
    ];

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.15 }}
        >
            {/* Floating frosted-glass pill */}
            <div className="mx-3 mb-3 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-2xl shadow-black/[0.08] px-1 py-1">
                <div className="flex items-center justify-around">
                    {navItems.map((item, idx) => {
                        const isActive = item.path
                            ? location.pathname === item.path
                            : false;

                        /* ── Central action button ── */
                        if (item.isCentral) {
                            return (
                                <button
                                    key={idx}
                                    onClick={() => item.path && navigate(item.path)}
                                    className="flex flex-col items-center gap-1.5 px-2 py-1.5 group"
                                >
                                    <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 active:scale-90 z-10">
                                        <item.icon className={cn("w-[22px] h-[22px] z-20 transition-colors", isActive ? "text-brand-charcoal" : "text-brand-charcoal")} strokeWidth={2.5} />
                                        {/* Background */}
                                        {isActive ? (
                                            <motion.div
                                                layoutId="mobile-nav-bg"
                                                className="absolute inset-0 bg-brand-yellow rounded-[14px] shadow-[0_4px_16px_rgba(252,211,77,0.4)]"
                                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-brand-yellow/20 rounded-[14px] group-hover:bg-brand-yellow/40 transition-colors" />
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[10px] tracking-wide transition-all",
                                            isActive ? "text-foreground font-bold" : "text-muted-foreground font-semibold"
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        /* ── Regular tab button ── */
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (item.onClick) item.onClick();
                                    else if (item.path) navigate(item.path);
                                }}
                                className="flex flex-col items-center gap-1.5 px-2 py-1.5 group"
                            >
                                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 active:scale-90 z-10">
                                    <item.icon
                                        className={cn(
                                            "w-[22px] h-[22px] transition-colors z-20",
                                            isActive
                                                ? "text-brand-charcoal"
                                                : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {/* Active Background Pill */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-bg"
                                            className="absolute inset-0 bg-brand-yellow rounded-[14px] shadow-[0_4px_16px_rgba(252,211,77,0.4)]"
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    {/* Unread badge */}
                                    {item.badge != null && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white px-1 leading-none z-30 shadow-sm">
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-[11px] transition-all",
                                        isActive
                                            ? "text-foreground font-bold"
                                            : "text-muted-foreground font-semibold group-hover:text-slate-600"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export { MobileNav };
export default MobileNav;

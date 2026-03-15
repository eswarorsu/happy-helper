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
                                    className="flex flex-col items-center gap-0.5 px-3 py-1 group"
                                >
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 active:scale-90",
                                            isActive
                                                ? "bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/40"
                                                : "bg-brand-yellow/20 text-brand-charcoal group-hover:bg-brand-yellow/40"
                                        )}
                                    >
                                        <item.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[9px] font-bold tracking-wide",
                                            isActive ? "text-brand-yellow" : "text-brand-charcoal/55"
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
                                className="flex flex-col items-center gap-0.5 px-3 py-1 group"
                            >
                                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 active:scale-90">
                                    <item.icon
                                        className={cn(
                                            "w-[18px] h-[18px] transition-colors",
                                            isActive
                                                ? "text-brand-yellow"
                                                : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {/* Tiny active dot */}
                                    {isActive && (
                                        <motion.span
                                            layoutId="mobile-nav-dot"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-yellow"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    {/* Unread badge */}
                                    {item.badge != null && item.badge > 0 && (
                                        <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-1 leading-none">
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-[9px] font-semibold transition-colors",
                                        isActive
                                            ? "text-brand-yellow"
                                            : "text-slate-400 group-hover:text-slate-600"
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

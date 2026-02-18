import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard, Store, Receipt, Handshake,
    MessageSquare, User, LogOut, Settings, Search,
    ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";

interface InvestorSidebarProps {
    userName?: string;
    onLogout: () => void;
    unreadCount?: number;
    onMessagesClick: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/investor-dashboard" },
    { label: "Idea Marketplace", icon: Search, path: "/marketplace" },
    { label: "Deal Center", icon: Handshake, path: "/deal-center" },
    { label: "Transactions", icon: Receipt, path: "/transactions" },
    { label: "Profile", icon: User, path: "/profile" },
];

export function InvestorSidebar({
    userName,
    onLogout,
    unreadCount = 0,
    onMessagesClick,
    collapsed = false,
    onToggleCollapse,
}: InvestorSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950 text-slate-300 border-r border-slate-800 z-40 transition-all duration-300",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Brand - Pearl Street Style */}
            <div className="px-5 pt-6 pb-6 flex items-center gap-3">
                <Logo size="sm" />
                {!collapsed && (
                    <div className="flex flex-col min-w-0">
                        <span className="text-lg font-bold tracking-tight text-white">Innovestor</span>
                    </div>
                )}
            </div>

            {/* Collapse Toggle */}
            {onToggleCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className="absolute -right-3 top-8 bg-white border border-slate-200 shadow-sm flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-50 transition-colors text-slate-500 z-50"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft className={cn("w-3 h-3 transition-transform", collapsed && "rotate-180")} />
                </button>
            )}



            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-brand-yellow text-brand-charcoal shadow-md shadow-brand-yellow/10"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-brand-charcoal" : "text-slate-500 group-hover:text-brand-yellow")} />
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}

                {/* Messages - special with badge */}
                <button
                    onClick={onMessagesClick}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-sm group"
                    )}
                    title={collapsed ? "Messages" : undefined}
                >
                    <div className="relative flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-brand-yellow transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-yellow text-[9px] font-bold rounded-full flex items-center justify-center text-brand-charcoal ring-2 ring-slate-950">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    {!collapsed && <span>Messages</span>}
                    {!collapsed && unreadCount > 0 && (
                        <span className="ml-auto bg-brand-yellow text-brand-charcoal text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </nav>

            {/* Bottom Section - User Profile */}
            <div className="px-3 pb-6 pt-4 mt-auto">
                <div className={cn(
                    "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer",
                    collapsed ? "justify-center" : "bg-white/5 border border-white/10 shadow-sm hover:bg-white/10"
                )} onClick={() => navigate('/profile')}>
                    <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-charcoal font-bold text-sm">
                        {userName?.charAt(0) || "I"}
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold text-white truncate">{userName || "Investor"}</span>
                            <span className="text-[11px] text-slate-400 truncate">investor@example.com</span>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {collapsed && (
                    <button onClick={onLogout} className="mt-4 w-full flex justify-center text-slate-500 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.aside>
    );
}

export default InvestorSidebar;

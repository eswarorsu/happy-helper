import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, LayoutDashboard, Store, Receipt,
    User, LogOut, MessageSquare, FileText, PlusCircle,
    Search, Handshake
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
    userType?: "founder" | "investor";
    userName?: string;
    onLogout?: () => void;
    unreadCount?: number;
    onMessagesClick?: () => void;
}

const MobileNav = ({ userType, userName, onLogout, unreadCount = 0, onMessagesClick }: MobileNavProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const founderLinks = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/founder-dashboard" },
        { label: "Submit Idea", icon: PlusCircle, path: "/submit-idea" },
        { label: "Transactions", icon: Receipt, path: "/transactions" },
        { label: "Profile", icon: User, path: "/profile" },
    ];

    const investorLinks = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/investor-dashboard" },
        { label: "Marketplace", icon: Store, path: "/marketplace" },
        { label: "Transactions", icon: Receipt, path: "/transactions" },
        { label: "Profile", icon: User, path: "/profile" },
    ];

    const links = userType === "founder" ? founderLinks : investorLinks;

    return (
        <>
            {/* Hamburger Trigger — visible only below lg */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-full hover:bg-black/5"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-brand-charcoal" />
            </Button>

            {/* Portal: render drawer + backdrop directly on document.body to escape
                any parent overflow / transform / stacking-context issues */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 bg-black/55 backdrop-blur-sm"
                                style={{ zIndex: 9998 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Drawer */}
                            <motion.nav
                                className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-brand-yellow shadow-2xl flex flex-col border-r border-black/10"
                                style={{ zIndex: 9999 }}
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                    <div className="flex items-center gap-2.5">
                                        <Logo size="sm" />
                                        <span className="text-lg font-bold tracking-tight text-brand-charcoal">INNOVESTOR</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full hover:bg-black/5"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="w-5 h-5 text-brand-charcoal" />
                                    </Button>
                                </div>

                                {/* User Info */}
                                {userName && (
                                    <div className="px-5 py-4 border-b border-border/60">
                                        <p className="text-sm font-semibold text-brand-charcoal">{userName}</p>
                                        <p className="text-xs text-brand-charcoal/70 capitalize">{userType} Account</p>
                                    </div>
                                )}

                                {/* Nav Links */}
                                <div className="flex-1 overflow-y-auto py-3 px-3 overscroll-contain">
                                    {links.map((link) => {
                                        const isActive = location.pathname === link.path;
                                        return (
                                            <button
                                                key={link.path}
                                                onClick={() => handleNavigate(link.path)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all ${isActive
                                                    ? "bg-brand-charcoal text-brand-yellow"
                                                    : "text-brand-charcoal/80 hover:bg-black/5 hover:text-brand-charcoal"
                                                    }`}
                                            >
                                                <link.icon className="w-5 h-5 shrink-0" />
                                                {link.label}
                                            </button>
                                        );
                                    })}

                                    {/* Messages Button */}
                                    {onMessagesClick && (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                onMessagesClick();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium text-brand-charcoal/80 hover:bg-black/5 hover:text-brand-charcoal transition-all"
                                        >
                                            <MessageSquare className="w-5 h-5 shrink-0" />
                                            Messages
                                            {unreadCount > 0 && (
                                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Bottom Actions */}
                                <div className="border-t border-border p-3">
                                    {onLogout && (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                                        >
                                            <LogOut className="w-5 h-5 shrink-0" />
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </motion.nav>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export { MobileNav };
export default MobileNav;

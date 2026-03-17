import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";

const LandingNavbar = () => {
    const [navScrolled, setNavScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                navScrolled 
                    ? "top-4 mx-4 sm:mx-8 xl:mx-auto max-w-7xl rounded-2xl bg-black/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 py-2" 
                    : "top-0 w-full bg-transparent py-4 border-b border-transparent"
                }`}
            style={{ 
                backdropFilter: navScrolled ? "blur(20px) saturate(180%)" : "none",
                WebkitBackdropFilter: navScrolled ? "blur(20px) saturate(180%)" : "none"
            }}
        >
            <div className={`mx-auto flex items-center justify-between px-4 sm:px-6 transition-all ${navScrolled ? "w-full" : "max-w-7xl"}`}>
                {/* Logo */}
                <Link to="/">
                    <Logo showText light={true} />
                </Link>

                {/* Center Nav */}
                <nav
                    className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-2xl transition-all duration-300 bg-white/5 backdrop-blur-md border border-white/10`}
                >
                    {[
                        { label: "How it works", href: "#how-it-works" },
                        { label: "Features", href: "#features" },
                        { label: "For Founders", href: "#for-founders" },
                        { label: "For Investors", href: "#for-investors" },
                        { label: "FAQ", href: "#faq" },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all text-white/90 hover:bg-white/10 hover:text-brand-yellow`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link to="/auth?mode=login" className="hidden sm:block">
                        <Button
                            variant="ghost"
                            className={`text-sm font-medium rounded-xl px-5 transition-colors text-white hover:bg-white/10 hover:text-white`}
                        >
                            Login
                        </Button>
                    </Link>
                    <Link to="/auth?mode=register" className="hidden sm:block">
                        <Button className="text-sm font-medium px-6 text-brand-charcoal shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-brand-yellow hover:bg-brand-yellow/90 border-0 rounded-xl">
                            Join for free
                        </Button>
                    </Link>
                    {/* Mobile Hamburger */}
                    <button
                        className={`lg:hidden p-2 rounded-xl transition-colors hover:bg-white/10 text-white`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>
            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="lg:hidden mt-3 mx-4 sm:mx-8 rounded-2xl border border-white/10 p-4 space-y-2 bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl">
                    {[
                        { label: "How it works", href: "#how-it-works" },
                        { label: "Features", href: "#features" },
                        { label: "For Founders", href: "#for-founders" },
                        { label: "For Investors", href: "#for-investors" },
                        { label: "FAQ", href: "#faq" },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10 text-white/90 hover:text-brand-yellow"
                        >
                            {item.label}
                        </a>
                    ))}
                    <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10 lg:hidden">
                        <Link
                            to="/auth?mode=login"
                            className="w-full"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Button
                                variant="outline"
                                className="w-full text-sm font-medium rounded-xl text-white border-white/20 hover:bg-white/10 hover:border-white/30"
                            >
                                Login
                            </Button>
                        </Link>
                        <Link
                            to="/auth?mode=register"
                            className="w-full"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Button className="w-full text-sm font-medium rounded-xl text-brand-charcoal bg-brand-yellow hover:bg-brand-yellow/90 border-0">
                                Join for free
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default LandingNavbar;

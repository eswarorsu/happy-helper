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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? "bg-white/95 shadow-md py-3" : "bg-transparent py-4"
                }`}
            style={{ backdropFilter: navScrolled ? "blur(12px)" : "none" }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
                {/* Logo */}
                <Link to="/">
                    <Logo showText light={!navScrolled} />
                </Link>

                {/* Center Nav */}
                <nav
                    className={`hidden lg:flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 ${navScrolled
                            ? "bg-gray-100/80"
                            : "bg-white/10 backdrop-blur-md border border-white/10"
                        }`}
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
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${navScrolled
                                    ? "hover:bg-white/60 text-gray-600 hover:text-brand-yellow"
                                    : "text-white/90 hover:bg-white/10 hover:text-white"
                                }`}
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
                            className={`text-sm font-medium rounded-full px-5 transition-colors ${navScrolled
                                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    : "text-white hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            Login
                        </Button>
                    </Link>
                    <Link to="/auth?mode=register" className="hidden sm:block">
                        <Button className="text-sm font-medium px-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-brand-charcoal hover:bg-brand-charcoal/90 border-0 rounded-md">
                            Join for free
                        </Button>
                    </Link>
                    {/* Mobile Hamburger */}
                    <button
                        className={`lg:hidden p-2 rounded-xl transition-colors ${navScrolled
                                ? "hover:bg-gray-100 text-gray-900"
                                : "hover:bg-white/10 text-white"
                            }`}
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
                <div className="lg:hidden border-t border-gray-200 px-6 py-4 space-y-2 bg-white/95 backdrop-blur-lg">
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
                            className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        >
                            {item.label}
                        </a>
                    ))}
                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-200 lg:hidden">
                        <Link
                            to="/auth?mode=login"
                            className="w-full"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Button
                                variant="outline"
                                className="w-full text-sm font-medium rounded-full text-gray-600 border-gray-300 hover:bg-gray-100"
                            >
                                Login
                            </Button>
                        </Link>
                        <Link
                            to="/auth?mode=register"
                            className="w-full"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Button className="w-full text-sm font-medium rounded-full text-white bg-brand-charcoal hover:bg-brand-charcoal/90 border-0">
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

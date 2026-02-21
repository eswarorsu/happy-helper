import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";

const Footer = () => {
    return (
        <footer style={{ background: "rgb(0, 0, 0)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-10">
                {/* Main Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
                    {/* Company */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-5">
                            <Logo size="sm" />
                            <span className="text-xl font-bold text-white tracking-tight">
                                INNOVESTOR
                            </span>
                        </div>
                        <p
                            className="text-sm leading-relaxed mb-6"
                            style={{ color: "#64748B" }}
                        >
                            Bridging the gap between visionary founders and strategic
                            investors. Transform your ideas into reality.
                        </p>
                        <div className="flex gap-3">
                            {[
                                {
                                    href: "https://twitter.com",
                                    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                                },
                                {
                                    href: "https://linkedin.com",
                                    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                                },
                                {
                                    href: "https://instagram.com",
                                    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                                },
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                    style={{ background: "rgba(255,255,255,0.06)" }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "#EFBF04")
                                    }
                                    onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                        "rgba(255,255,255,0.06)")
                                    }
                                >
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d={social.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { label: "Get Started", to: "/auth?mode=register" },
                                { label: "Login", to: "/auth?mode=login" },
                                { label: "How it Works", href: "#how-it-works" },
                                { label: "Features", href: "#features" },
                            ].map((item, i) => (
                                <li key={i}>
                                    {item.to ? (
                                        <Link
                                            to={item.to}
                                            className="text-sm transition-colors hover:text-white flex items-center gap-2 group"
                                            style={{ color: "#64748B" }}
                                        >
                                            <span
                                                className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: "#EFBF04" }}
                                            />
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <a
                                            href={item.href}
                                            className="text-sm transition-colors hover:text-white flex items-center gap-2 group"
                                            style={{ color: "#64748B" }}
                                        >
                                            <span
                                                className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: "#EFBF04" }}
                                            />
                                            {item.label}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { label: "Privacy Policy", to: "/privacy-policy" },
                                { label: "Terms & Conditions", to: "/terms-and-conditions" },
                                { label: "Refund Policy", to: "/refund-policy" },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        to={item.to}
                                        className="text-sm transition-colors hover:text-white flex items-center gap-2 group"
                                        style={{ color: "#64748B" }}
                                    >
                                        <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-brand-yellow" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">
                            Contact
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:support@innovestor.com"
                                    className="text-sm transition-colors hover:text-white flex items-center gap-2"
                                    style={{ color: "#64748B" }}
                                >
                                    <svg
                                        className="w-4 h-4 shrink-0 text-brand-yellow"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    support@innovestor.com
                                </a>
                            </li>
                            <li
                                className="flex items-start gap-2 text-sm"
                                style={{ color: "#64748B" }}
                            >
                                <svg
                                    className="w-4 h-4 shrink-0 mt-0.5 text-brand-yellow"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span>
                                    Vizag, Andhra Pradesh,
                                    <br />
                                    India - 530001
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div
                    className="h-px w-full mb-8"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                />

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-600">
                        © 2026 INNOVESTOR. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span>Made with</span>
                        <svg
                            className="w-3.5 h-3.5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

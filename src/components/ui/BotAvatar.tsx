import React from "react";

interface BotAvatarProps {
    className?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <style>
            {`
                @keyframes blink {
                    0%, 96%, 98% { transform: scaleY(1); }
                    97% { transform: scaleY(0.1); }
                    100% { transform: scaleY(1); }
                }
                .eye-left {
                    transform-origin: 38px 50px;
                    animation: blink 4s infinite ease-in-out;
                }
                .eye-right {
                    transform-origin: 62px 50px;
                    animation: blink 4s infinite ease-in-out;
                }
            `}
        </style>
        {/* Base glow */}
        <circle cx="50" cy="50" r="40" fill="#FDE047" opacity="0.2" filter="blur(10px)" />
        
        {/* Background dark circle to give it a solid base */}
        <circle cx="50" cy="55" r="42" fill="#0F172A" />
        <circle cx="50" cy="55" r="41" fill="url(#bg-gradient)" />

        {/* Neck / Shoulders */}
        <path d="M25 85 C 25 75, 75 75, 75 85 C 85 85, 90 95, 90 98 L 10 98 C 10 95, 15 85, 25 85 Z" fill="url(#shoulder-gradient)" />
        <path d="M35 70 L 65 70 L 70 85 L 30 85 Z" fill="#1E293B" />
        <path d="M40 76 L 60 76" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 81 L 58 81" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />

        {/* Head Base */}
        <path d="M20 45 A 30 30 0 0 1 80 45 C 80 68 65 75 50 75 C 35 75 20 68 20 45 Z" fill="url(#head-gradient)" />
        
        {/* Ears */}
        <rect x="12" y="40" width="10" height="20" rx="4" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.5" />
        <rect x="78" y="40" width="10" height="20" rx="4" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.5" />
        
        {/* Antenna */}
        <rect x="48" y="10" width="4" height="15" fill="#FBBF24" />
        <circle cx="50" cy="8" r="5" fill="#FEF08A" filter="url(#glow)" />
        <circle cx="50" cy="8" r="3" fill="#FFFFFF" />

        {/* Visor Area Base */}
        <rect x="25" y="38" width="50" height="24" rx="12" fill="#0F172A" />
        
        {/* Left Eye */}
        <g className="eye-left">
            <circle cx="38" cy="50" r="4" fill="#FEF08A" filter="url(#glow)" />
            <circle cx="38" cy="50" r="2.5" fill="#FFFFFF" />
        </g>
        
        {/* Right Eye */}
        <g className="eye-right">
            <circle cx="62" cy="50" r="4" fill="#FEF08A" filter="url(#glow)" />
            <circle cx="62" cy="50" r="2.5" fill="#FFFFFF" />
        </g>

        <defs>
            <linearGradient id="bg-gradient" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="shoulder-gradient" x1="10" y1="75" x2="90" y2="98">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="head-gradient" x1="20" y1="15" x2="80" y2="75">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
    </svg>
);

export default BotAvatar;

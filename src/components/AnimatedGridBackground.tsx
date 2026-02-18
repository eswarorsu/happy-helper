import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ============================================================================
// ANIMATED GRID BACKGROUND
// Premium Fintech aesthetic with subtle tracing beams and gradient mesh
// ============================================================================

interface AnimatedGridBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

const AnimatedGridBackground = ({ children, className = "" }: AnimatedGridBackgroundProps) => {
    const [beams, setBeams] = useState<{ id: number; x: number; y: number; direction: 'horizontal' | 'vertical'; delay: number }[]>([]);

    // Generate random tracing beams
    useEffect(() => {
        const generateBeam = () => {
            const id = Date.now();
            const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
            const position = Math.random() * 100;

            setBeams(prev => [...prev, {
                id,
                x: direction === 'horizontal' ? 0 : position,
                y: direction === 'vertical' ? 0 : position,
                direction,
                delay: 0
            }]);

            // Remove beam after animation completes
            setTimeout(() => {
                setBeams(prev => prev.filter(b => b.id !== id));
            }, 4000);
        };

        // Initial beams
        generateBeam();

        // Generate new beams periodically
        const interval = setInterval(generateBeam, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative min-h-screen overflow-hidden ${className}`}>
            {/* Base Background */}
            <div className="fixed inset-0 bg-background z-0" />

            {/* SVG Grid Pattern */}
            <div className="fixed inset-0 z-0 opacity-[0.4]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path
                                d="M 40 0 L 0 0 0 40"
                                fill="none"
                                stroke="rgb(148 163 184)"
                                strokeWidth="0.5"
                                strokeOpacity="0.3"
                            />
                        </pattern>
                        {/* Gradient for tracing beams */}
                        <linearGradient id="beam-gradient-h" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="40%" stopColor="rgb(100 116 139)" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="rgb(71 85 105)" stopOpacity="0.8" />
                            <stop offset="60%" stopColor="rgb(100 116 139)" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <linearGradient id="beam-gradient-v" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="40%" stopColor="rgb(100 116 139)" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="rgb(71 85 105)" stopOpacity="0.8" />
                            <stop offset="60%" stopColor="rgb(100 116 139)" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Tracing Beams */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {beams.map((beam) => (
                    <motion.div
                        key={beam.id}
                        className="absolute"
                        initial={{
                            x: beam.direction === 'horizontal' ? '-20%' : `${beam.x}%`,
                            y: beam.direction === 'vertical' ? '-20%' : `${beam.y}%`,
                            opacity: 0
                        }}
                        animate={{
                            x: beam.direction === 'horizontal' ? '120%' : `${beam.x}%`,
                            y: beam.direction === 'vertical' ? '120%' : `${beam.y}%`,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 4,
                            ease: "easeInOut",
                            delay: beam.delay
                        }}
                        style={{
                            width: beam.direction === 'horizontal' ? '200px' : '1px',
                            height: beam.direction === 'vertical' ? '200px' : '1px',
                            background: beam.direction === 'horizontal'
                                ? 'linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.5), rgba(71, 85, 105, 0.8), rgba(100, 116, 139, 0.5), transparent)'
                                : 'linear-gradient(180deg, transparent, rgba(100, 116, 139, 0.5), rgba(71, 85, 105, 0.8), rgba(100, 116, 139, 0.5), transparent)',
                            boxShadow: '0 0 20px rgba(71, 85, 105, 0.3)'
                        }}
                    />
                ))}
            </div>

            {/* Gradient Mesh Overlay - Edge fade effect */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top fade */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-100/80 to-transparent" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-100/80 to-transparent" />
                {/* Left fade */}
                <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-slate-100/60 to-transparent" />
                {/* Right fade */}
                <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-slate-100/60 to-transparent" />

                {/* Subtle radial vignette for center focus */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(241, 245, 249, 0.4) 100%)'
                    }}
                />
            </div>

            {/* Floating Ambient Orbs - Very subtle */}
            <motion.div
                className="fixed top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(148, 163, 184, 0.08) 0%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(100, 116, 139, 0.06) 0%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default AnimatedGridBackground;

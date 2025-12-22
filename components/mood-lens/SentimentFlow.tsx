'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SentimentFlowProps {
    sentiment: {
        valence: number; // -1 to 1
        arousal: number; // 0 to 1
        dominance: number; // 0 to 1
    };
    palette: string[];
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
}

export function SentimentFlow({ sentiment, palette }: SentimentFlowProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | undefined>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        updateSize();

        // Particle system parameters based on sentiment
        const particleCount = Math.floor(20 + sentiment.arousal * 80); // More particles = more energy
        const baseSpeed = 0.5 + sentiment.arousal * 2; // Faster = more arousal
        const verticalBias = sentiment.valence * 0.5; // Positive flows up, negative flows down

        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push(createParticle());
            }
        };

        const createParticle = (): Particle => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                vx: (Math.random() - 0.5) * baseSpeed,
                vy: (Math.random() - 0.5) * baseSpeed - verticalBias,
                size: 2 + Math.random() * 4,
                color: palette[Math.floor(Math.random() * palette.length)],
                life: 1,
            };
        };

        initParticles();

        // Animation loop
        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Update and draw particles
            particlesRef.current.forEach((particle, index) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Wrap around edges
                if (particle.x < 0) particle.x = rect.width;
                if (particle.x > rect.width) particle.x = 0;
                if (particle.y < 0) particle.y = rect.height;
                if (particle.y > rect.height) particle.y = 0;

                // Draw particle with glow
                ctx.save();
                ctx.globalAlpha = particle.life * 0.6;

                // Glow effect
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 3
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core particle
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Draw connections to nearby particles
                particlesRef.current.slice(index + 1).forEach(other => {
                    const dx = other.x - particle.x;
                    const dy = other.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.save();
                        ctx.globalAlpha = (1 - distance / 100) * 0.2;
                        ctx.strokeStyle = particle.color;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [sentiment, palette]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[300px] bg-black/90 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 relative overflow-hidden"
        >
            <h3 className="absolute top-4 left-4 text-sm font-medium text-white/70 z-10">
                Sentiment Flow
            </h3>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />

            {/* Sentiment indicators */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 text-xs text-white/60">
                <div className="flex items-center gap-2">
                    <span>Energy:</span>
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-400"
                            style={{ width: `${sentiment.arousal * 100}%` }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span>Flow:</span>
                    <span className="font-medium text-white/80">
                        {sentiment.valence > 0.2 ? '↑ Upward' : sentiment.valence < -0.2 ? '↓ Downward' : '→ Neutral'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

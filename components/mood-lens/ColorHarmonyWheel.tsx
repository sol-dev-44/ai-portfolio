'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ColorHarmonyWheelProps {
    palette: string[];
}

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function ColorHarmonyWheel({ palette }: ColorHarmonyWheelProps) {
    const colorPositions = useMemo(() => {
        return palette.map((color) => {
            const hsl = hexToHSL(color);
            const angle = (hsl.h * Math.PI) / 180;
            const radius = 80;
            return {
                color,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                hue: hsl.h,
                saturation: hsl.s,
                lightness: hsl.l,
            };
        });
    }, [palette]);

    // Calculate average temperature
    const avgTemp = useMemo(() => {
        const temps = colorPositions.map(c => {
            // Warm colors: 0-60 (red-yellow) and 300-360 (magenta-red)
            // Cool colors: 120-240 (green-blue)
            if (c.hue < 60 || c.hue > 300) return 1; // warm
            if (c.hue > 120 && c.hue < 240) return -1; // cool
            return 0; // neutral
        });
        return temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
    }, [colorPositions]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[300px] bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 relative overflow-hidden"
        >
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Color Harmony
            </h3>

            <svg
                viewBox="-120 -120 240 240"
                className="w-full h-full"
                style={{ maxHeight: '240px' }}
            >
                {/* Background circle */}
                <circle
                    cx="0"
                    cy="0"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-neutral-300 dark:text-neutral-700"
                    opacity="0.3"
                />

                {/* Color wheel gradient background */}
                <defs>
                    <radialGradient id="wheelGradient">
                        <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="0" cy="0" r="90" fill="url(#wheelGradient)" />

                {/* Harmony lines connecting colors */}
                {colorPositions.map((color1, i) =>
                    colorPositions.slice(i + 1).map((color2, j) => {
                        const hueDiff = Math.abs(color1.hue - color2.hue);
                        const isHarmonic =
                            hueDiff < 30 || // analogous
                            (hueDiff > 150 && hueDiff < 210) || // complementary
                            (hueDiff > 110 && hueDiff < 130); // triadic

                        if (!isHarmonic) return null;

                        return (
                            <line
                                key={`${i}-${j}`}
                                x1={color1.x}
                                y1={color1.y}
                                x2={color2.x}
                                y2={color2.y}
                                stroke={color1.color}
                                strokeWidth="1"
                                opacity="0.2"
                            />
                        );
                    })
                )}

                {/* Color dots */}
                {colorPositions.map((pos, i) => (
                    <g key={i}>
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            cx={pos.x}
                            cy={pos.y}
                            r="12"
                            fill={pos.color}
                            stroke="white"
                            strokeWidth="2"
                            className="cursor-pointer hover:r-14 transition-all"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                        >
                            <title>{pos.color}</title>
                        </motion.circle>
                    </g>
                ))}
            </svg>

            {/* Temperature indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Temp:</span>
                <div className="flex items-center gap-1">
                    {avgTemp > 0.2 ? (
                        <>
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">Warm</span>
                        </>
                    ) : avgTemp < -0.2 ? (
                        <>
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Cool</span>
                        </>
                    ) : (
                        <>
                            <div className="w-3 h-3 rounded-full bg-neutral-500" />
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Neutral</span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

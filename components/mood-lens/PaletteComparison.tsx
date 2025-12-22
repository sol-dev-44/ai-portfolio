'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PaletteComparisonProps {
    paletteA: string[];
    paletteB: string[];
}

// Simple color similarity based on RGB distance
function colorSimilarity(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 0;

    const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    // Max distance is sqrt(255^2 * 3) ≈ 441
    return Math.max(0, 1 - distance / 441);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function PaletteComparison({ paletteA, paletteB }: PaletteComparisonProps) {
    const analysis = useMemo(() => {
        // Find shared colors (similar colors)
        const sharedColors: Array<{ colorA: string; colorB: string; similarity: number }> = [];
        const uniqueA: string[] = [];
        const uniqueB: string[] = [];

        paletteA.forEach(colorA => {
            let maxSimilarity = 0;
            let matchingColorB = '';

            paletteB.forEach(colorB => {
                const sim = colorSimilarity(colorA, colorB);
                if (sim > maxSimilarity) {
                    maxSimilarity = sim;
                    matchingColorB = colorB;
                }
            });

            if (maxSimilarity > 0.7) {
                sharedColors.push({ colorA, colorB: matchingColorB, similarity: maxSimilarity });
            } else {
                uniqueA.push(colorA);
            }
        });

        // Find unique B colors
        paletteB.forEach(colorB => {
            const isShared = sharedColors.some(s => s.colorB === colorB);
            if (!isShared) {
                uniqueB.push(colorB);
            }
        });

        // Calculate overall similarity
        const overallSimilarity = sharedColors.length / Math.max(paletteA.length, paletteB.length);

        return { sharedColors, uniqueA, uniqueB, overallSimilarity };
    }, [paletteA, paletteB]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Palette Comparison
                </h3>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {Math.round(analysis.overallSimilarity * 100)}% similar
                </div>
            </div>

            {/* Shared Colors */}
            {analysis.sharedColors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                        Shared Tones
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.sharedColors.map((shared, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div
                                    className="w-8 h-8 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    style={{ backgroundColor: shared.colorA }}
                                    title={`A: ${shared.colorA}`}
                                />
                                <div className="text-xs text-neutral-400">≈</div>
                                <div
                                    className="w-8 h-8 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    style={{ backgroundColor: shared.colorB }}
                                    title={`B: ${shared.colorB}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Unique to A */}
            {analysis.uniqueA.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Unique to Image A
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.uniqueA.map((color, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-md shadow-sm ring-2 ring-blue-500/30 cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => navigator.clipboard.writeText(color)}
                                title={`Copy ${color}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Unique to B */}
            {analysis.uniqueB.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide">
                        Unique to Image B
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.uniqueB.map((color, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-md shadow-sm ring-2 ring-pink-500/30 cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => navigator.clipboard.writeText(color)}
                                title={`Copy ${color}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

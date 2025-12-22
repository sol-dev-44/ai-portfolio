'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface StyleRadarProps {
    styleA: {
        contrast: number;
        brightness: number;
        warmth: number;
        sharpness: number;
    };
    styleB: {
        contrast: number;
        brightness: number;
        warmth: number;
        sharpness: number;
    };
}

export function StyleRadar({ styleA, styleB }: StyleRadarProps) {
    const data = [
        {
            attribute: 'Contrast',
            A: Math.round(styleA.contrast * 100),
            B: Math.round(styleB.contrast * 100),
        },
        {
            attribute: 'Brightness',
            A: Math.round(styleA.brightness * 100),
            B: Math.round(styleB.brightness * 100),
        },
        {
            attribute: 'Warmth',
            A: Math.round(styleA.warmth * 100),
            B: Math.round(styleB.warmth * 100),
        },
        {
            attribute: 'Sharpness',
            A: Math.round(styleA.sharpness * 100),
            B: Math.round(styleB.sharpness * 100),
        },
    ];

    // Calculate differences
    const differences = data.map(d => ({
        attribute: d.attribute,
        diff: Math.abs(d.A - d.B),
    })).sort((a, b) => b.diff - a.diff);

    const maxDiff = differences[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Visual Style Comparison
                </h3>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="#404040" />
                        <PolarAngleAxis
                            dataKey="attribute"
                            tick={{ fill: '#a3a3a3', fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#a3a3a3', fontSize: 10 }}
                        />
                        <Radar
                            name="Image A"
                            dataKey="A"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Radar
                            name="Image B"
                            dataKey="B"
                            stroke="#ec4899"
                            fill="#ec4899"
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '12px'
                            }}
                            iconType="circle"
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Key Difference */}
            {maxDiff.diff > 15 && (
                <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-lg p-3 border border-purple-500/20">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Biggest Difference: <span className="font-bold">{maxDiff.attribute}</span>
                        <span className="ml-2 text-purple-600 dark:text-purple-400">
                            ({maxDiff.diff}% variance)
                        </span>
                    </div>
                </div>
            )}

            {/* Attribute breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                {data.map((item) => (
                    <div key={item.attribute} className="space-y-1">
                        <div className="font-medium text-neutral-700 dark:text-neutral-300">
                            {item.attribute}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400 w-8">A: {item.A}</span>
                            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${item.A}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-pink-600 dark:text-pink-400 w-8">B: {item.B}</span>
                            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-pink-500"
                                    style={{ width: `${item.B}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

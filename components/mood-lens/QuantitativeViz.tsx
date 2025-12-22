
'use client';

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { motion } from 'framer-motion';

interface QuantitativeVizProps {
    sentiment: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    hideDominance?: boolean;
}

export function QuantitativeViz({ sentiment, hideDominance = false }: QuantitativeVizProps) {
    // Normalize data for the chart
    // Valence: -1 to 1 -> Map to 0-100 (where 50 is neutral)
    // Arousal: 0 to 1 -> Map to 0-100
    // Dominance: 0 to 1 -> Map to 0-100

    const allData = [
        {
            subject: 'Positivity', // Mapped Valence
            A: ((sentiment.valence + 1) / 2) * 100,
            fullMark: 100,
        },
        {
            subject: 'Energy', // Arousal
            A: sentiment.arousal * 100,
            fullMark: 100,
        },
        {
            subject: 'Control', // Dominance
            A: sentiment.dominance * 100,
            fullMark: 100,
        },
    ];

    // Filter out dominance if requested
    const data = hideDominance
        ? allData.filter(item => item.subject !== 'Control')
        : allData;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[300px] bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 relative"
        >
            <h3 className="absolute top-4 left-4 text-sm font-medium text-neutral-400">Emotional Dimensions</h3>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#404040" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Mood"
                        dataKey="A"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#fff' }}
                        itemStyle={{ color: '#c4b5fd' }}
                        formatter={(value: number) => Math.round(value)}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

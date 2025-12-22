
'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface EmotionBreakdownProps {
    emotions: Array<{ name: string; score: number }>;
}

export function EmotionBreakdown({ emotions }: EmotionBreakdownProps) {
    // Sort emotions by score descending
    const sortedData = [...emotions].sort((a, b) => b.score - a.score);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[300px] bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 relative"
        >
            <h3 className="absolute top-4 left-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Emotion Breakdown</h3>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} layout="vertical" margin={{ top: 40, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fill: '#a3a3a3', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#fff' }}
                        itemStyle={{ color: '#c4b5fd' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#6d28d9'} fillOpacity={1 - (index * 0.15)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

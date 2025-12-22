'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MoodCloudProps {
    keywordsA: string[];
    keywordsB: string[];
}

interface WordData {
    word: string;
    inA: boolean;
    inB: boolean;
    size: number;
}

export function MoodCloud({ keywordsA, keywordsB }: MoodCloudProps) {
    const wordData = useMemo(() => {
        const allWords = new Set([...keywordsA, ...keywordsB]);
        const data: WordData[] = [];

        allWords.forEach(word => {
            const inA = keywordsA.includes(word);
            const inB = keywordsB.includes(word);
            const count = (inA ? 1 : 0) + (inB ? 1 : 0);

            data.push({
                word,
                inA,
                inB,
                size: count === 2 ? 2 : 1, // Shared words are bigger
            });
        });

        return data.sort((a, b) => b.size - a.size);
    }, [keywordsA, keywordsB]);

    const getColor = (word: WordData) => {
        if (word.inA && word.inB) return 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 ring-purple-500/40';
        if (word.inA) return 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 ring-blue-500/40';
        return 'bg-pink-500/20 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 ring-pink-500/40';
    };

    const getSize = (word: WordData) => {
        return word.size === 2 ? 'text-lg px-4 py-2' : 'text-sm px-3 py-1.5';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Mood Keywords
                </h3>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                    <span className="text-neutral-600 dark:text-neutral-400">Image A</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-pink-500/40" />
                    <span className="text-neutral-600 dark:text-neutral-400">Image B</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-purple-500/40" />
                    <span className="text-neutral-600 dark:text-neutral-400">Both</span>
                </div>
            </div>

            {/* Word cloud */}
            <div className="flex flex-wrap gap-2 justify-center min-h-[120px] items-center">
                {wordData.map((word, i) => (
                    <motion.span
                        key={word.word}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`
                            ${getSize(word)}
                            ${getColor(word)}
                            rounded-full font-medium ring-1 
                            hover:scale-110 transition-transform cursor-default
                        `}
                        title={
                            word.inA && word.inB
                                ? 'Present in both images'
                                : word.inA
                                    ? 'Only in Image A'
                                    : 'Only in Image B'
                        }
                    >
                        {word.word}
                    </motion.span>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {wordData.filter(w => w.inA && !w.inB).length}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">A Only</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {wordData.filter(w => w.inA && w.inB).length}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Shared</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {wordData.filter(w => w.inB && !w.inA).length}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">B Only</div>
                </div>
            </div>
        </motion.div>
    );
}

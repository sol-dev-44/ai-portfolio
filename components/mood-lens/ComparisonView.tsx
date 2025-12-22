'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { MoodLensAnalysisResponse } from '@/store/api/moodLensApi';
import { GenerativeViz } from './GenerativeViz';
import { QuantitativeViz } from './QuantitativeViz';
import { EmotionBreakdown } from './EmotionBreakdown';
import { PaletteComparison } from './PaletteComparison';
import { MoodCloud } from './MoodCloud';
import { StyleRadar } from './StyleRadar';
import { calculateEmotionalDistance, generateComparisonInsights } from '@/utils/emotionalDistance';

interface ComparisonViewProps {
    analysisA: MoodLensAnalysisResponse;
    analysisB: MoodLensAnalysisResponse;
}

export function ComparisonView({ analysisA, analysisB }: ComparisonViewProps) {
    const distance = useMemo(
        () => calculateEmotionalDistance(analysisA.sentiment, analysisB.sentiment),
        [analysisA.sentiment, analysisB.sentiment]
    );

    const insights = useMemo(
        () => generateComparisonInsights(analysisA.sentiment, analysisB.sentiment, distance),
        [analysisA.sentiment, analysisB.sentiment, distance]
    );

    // Determine similarity color
    const getSimilarityColor = (similarity: number) => {
        if (similarity > 70) return 'text-green-600 dark:text-green-400';
        if (similarity > 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="space-y-8">
            {/* Similarity Indicator */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 p-6 bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800"
            >
                <div className="flex items-center gap-3">
                    <ArrowLeftRight className="w-5 h-5 text-neutral-500" />
                    <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Emotional Similarity</h3>
                </div>

                <div className={`text-5xl font-bold ${getSimilarityColor(distance.similarity)}`}>
                    {distance.similarity}%
                </div>

                {insights.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {insights.map((insight, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
                            >
                                {insight}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* New Comparison Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaletteComparison paletteA={analysisA.colorPalette} paletteB={analysisB.colorPalette} />
                <MoodCloud keywordsA={analysisA.moodKeywords} keywordsB={analysisB.moodKeywords} />
            </div>

            <StyleRadar styleA={analysisA.style} styleB={analysisB.style} />

            {/* Side-by-Side Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image A */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">A</span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Image A</h3>
                    </div>

                    <GenerativeViz
                        sentiment={analysisA.sentiment}
                        palette={analysisA.colorPalette}
                        style={analysisA.style}
                    />

                    {analysisA.sentiment && (
                        <QuantitativeViz sentiment={analysisA.sentiment} hideDominance={true} />
                    )}

                    {analysisA.emotions && (
                        <EmotionBreakdown emotions={analysisA.emotions} />
                    )}
                </div>

                {/* Image B */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 dark:bg-pink-500/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-pink-700 dark:text-pink-400">B</span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Image B</h3>
                    </div>

                    <GenerativeViz
                        sentiment={analysisB.sentiment}
                        palette={analysisB.colorPalette}
                        style={analysisB.style}
                    />

                    {analysisB.sentiment && (
                        <QuantitativeViz sentiment={analysisB.sentiment} hideDominance={true} />
                    )}

                    {analysisB.emotions && (
                        <EmotionBreakdown emotions={analysisB.emotions} />
                    )}
                </div>
            </div>
        </div>
    );
}

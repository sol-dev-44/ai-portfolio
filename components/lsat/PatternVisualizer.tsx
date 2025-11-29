'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PatternVisualizerProps {
    analysis: string | null;
    isAnalyzing: boolean;
}

export function PatternVisualizer({ analysis, isAnalyzing }: PatternVisualizerProps) {
    // Parse JSON from the analysis string if possible, otherwise treat as markdown
    const parsedAnalysis = React.useMemo(() => {
        if (!analysis) return null;
        try {
            // Try to find JSON block
            const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/) || analysis.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
        } catch (e) {
            console.warn("Could not parse analysis as JSON", e);
        }
        return null;
    }, [analysis]);

    if (isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-full max-w-md space-y-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-gray-500 font-medium animate-pulse">Deconstructing logical structure...</p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to Analyze</h3>
                <p className="max-w-xs mx-auto">Select an answer and click Analyze to see a detailed breakdown of the logic pattern.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm h-full overflow-y-auto">
            <div className="prose dark:prose-invert max-w-none">
                {parsedAnalysis ? (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider m-0">Pattern Type</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white m-0">{parsedAnalysis.pattern_type}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 mb-8">
                            {/* Placeholder for dynamic visualization based on pattern type */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Logic Flow</h4>
                                <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic">
                                    Visualization for {parsedAnalysis.pattern_type} would go here
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold mb-4">Step-by-Step Breakdown</h3>
                        <ReactMarkdown>{parsedAnalysis.breakdown}</ReactMarkdown>

                        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                            <h3 className="text-green-800 dark:text-green-400 font-bold mb-2 mt-0">Why it's correct</h3>
                            <ReactMarkdown>{parsedAnalysis.explanation}</ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                )}
            </div>
        </div>
    );
}

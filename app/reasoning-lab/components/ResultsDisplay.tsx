'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, ChevronDown, ChevronUp, BarChart2, Info, Brain, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReasoningTrace {
    trace_index: number;
    reasoning_text: string;
    final_answer: string;
    score?: number;
    is_golden?: boolean;
    votes?: number;
}

interface ResultsDisplayProps {
    traces: ReasoningTrace[];
    strategy: string;
    problemText?: string;
    totalCost?: number;
    totalTokens?: number;
}

function ScoreTooltip() {
    return (
        <div className="group relative inline-block ml-2">
            <Info className="w-4 h-4 text-gray-400 hover:text-purple-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="font-bold mb-1">AI Reward Model Score (1-10)</div>
                <p>Calculated by an independent "Critic" AI that evaluates:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-gray-300">
                    <li>Logical correctness</li>
                    <li>Clarity of reasoning</li>
                    <li>Efficiency (no hallucinations)</li>
                </ul>
            </div>
        </div>
    );
}

function StrategyInfoButton({ strategy }: { strategy: string }) {
    const [showInfo, setShowInfo] = useState(false);

    const getStrategyInfo = () => {
        if (strategy === 'zero_shot_cot') {
            return {
                title: 'Zero-Shot Chain-of-Thought',
                icon: <Brain className="w-6 h-6" />,
                description: 'Prompts the model to "think step by step" without providing examples.',
                howItWorks: [
                    'The model receives only the problem and the instruction to reason step-by-step',
                    'No examples or prior solutions are provided',
                    'Generates a single reasoning chain from scratch',
                    'Useful for quick, straightforward problems'
                ],
                benefits: ['Fast (~10 seconds)', 'Low cost', 'No example data needed'],
                limitations: ['Single attempt (no self-correction)', 'May miss edge cases', 'No consensus mechanism']
            };
        } else if (strategy === 'self_consistency') {
            return {
                title: 'Self-Consistency',
                icon: <Zap className="w-6 h-6" />,
                description: 'Generates multiple reasoning paths and uses majority voting to find the most reliable answer.',
                howItWorks: [
                    'Generates 5 independent reasoning chains with temperature > 0 for diversity',
                    'Each chain approaches the problem differently',
                    'Groups chains by their final answer',
                    'The answer with the most "votes" (most chains agreeing) wins',
                    'Provides confidence through consensus'
                ],
                benefits: ['More reliable than single-shot', 'Shows confidence via vote distribution', 'Catches errors through diversity'],
                limitations: ['Slower (~30 seconds)', 'Higher cost (5x traces)', 'May still miss correct answer if minority']
            };
        }
        return null;
    };

    const info = getStrategyInfo();
    if (!info) return null;

    return (
        <>
            <button
                onClick={() => setShowInfo(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
                <Info className="w-4 h-4" />
                How does this work?
            </button>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                                        {info.icon}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{info.title}</h2>
                                </div>

                                <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                    {info.description}
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How It Works</h3>
                                        <ol className="list-decimal list-inside space-y-2 text-base text-gray-700 dark:text-gray-300">
                                            {info.howItWorks.map((step, idx) => (
                                                <li key={idx} className="leading-relaxed">{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <h4 className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">✅ Benefits</h4>
                                            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                                                {info.benefits.map((benefit, idx) => (
                                                    <li key={idx}>• {benefit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2">⚠️ Limitations</h4>
                                            <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                                                {info.limitations.map((limitation, idx) => (
                                                    <li key={idx}>• {limitation}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowInfo(false)}
                                    className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Got it!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default function ResultsDisplay({ traces, strategy, problemText, totalCost, totalTokens }: ResultsDisplayProps) {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Group traces by final answer for Self-Consistency
    const groupedTraces = traces.reduce((acc, trace) => {
        const key = trace.final_answer || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(trace);
        return acc;
    }, {} as Record<string, ReasoningTrace[]>);

    // Sort groups by vote count (descending)
    const sortedGroups = Object.entries(groupedTraces).sort(([, a], [, b]) => b.length - a.length);
    const totalTraces = traces.length;

    // Default to expanding the winner
    if (strategy === 'self_consistency' && !expandedGroup && sortedGroups.length > 0) {
        setExpandedGroup(sortedGroups[0][0]);
    }

    const SummaryCard = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Experiment Summary
                </h3>
                <StrategyInfoButton strategy={strategy} />
            </div>

            {problemText && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Problem
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {problemText}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                        Total Tokens
                    </div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {totalTokens?.toLocaleString() || '0'}
                    </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                        Estimated Cost
                    </div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        ${totalCost?.toFixed(4) || '0.0000'}
                    </div>
                </div>
            </div>
        </div>
    );

    if (strategy === 'self_consistency') {
        return (
            <div className="space-y-6">
                <SummaryCard />

                {/* Consensus Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Consensus Distribution
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {sortedGroups.map(([answer, groupTraces], idx) => {
                            const percentage = (groupTraces.length / totalTraces) * 100;
                            const isWinner = idx === 0;

                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className={`font-medium ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {isWinner ? '🏆 Majority Consensus' : `Option ${idx + 1}`}
                                        </span>
                                        <span className="text-gray-500">
                                            {groupTraces.length}/{totalTraces} votes ({percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                                            className={`h-full rounded-full ${isWinner ? 'bg-green-500' : 'bg-gray-400'}`}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {answer}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Grouped Traces Accordion */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-1">
                        Detailed Reasoning Paths
                    </h3>

                    {sortedGroups.map(([answer, groupTraces], idx) => {
                        const isExpanded = expandedGroup === answer;
                        const isWinner = idx === 0;

                        return (
                            <div key={idx} className={`rounded-xl border transition-colors ${isWinner
                                ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }`}>
                                <button
                                    onClick={() => setExpandedGroup(isExpanded ? null : answer)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isWinner ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {groupTraces.length}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-base font-medium text-gray-900 dark:text-white">
                                                {answer}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {groupTraces.length} reasoning path{groupTraces.length !== 1 ? 's' : ''} led to this answer
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700/50">
                                                {groupTraces.map((trace, tIdx) => (
                                                    <div key={tIdx} className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                Path {tIdx + 1}
                                                            </span>
                                                            {trace.score && (
                                                                <div className="flex items-center">
                                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${trace.score >= 8 ? 'bg-green-100 text-green-700' :
                                                                        trace.score >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        Score: {trace.score}/10
                                                                    </span>
                                                                    <ScoreTooltip />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            <ReactMarkdown>{trace.reasoning_text}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Default view for other strategies
    return (
        <div className="space-y-6">
            <SummaryCard />

            {traces.map((trace, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Reasoning Chain
                        </h3>
                        {trace.score && (
                            <div className="flex items-center">
                                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${trace.score >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                    trace.score >= 5 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                    Score: {trace.score}/10
                                </span>
                                <ScoreTooltip />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Reasoning Chain
                            </div>
                            <div className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                                <ReactMarkdown>{trace.reasoning_text}</ReactMarkdown>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Final Answer
                            </div>
                            <div className="text-lg font-medium text-gray-900 dark:text-white">
                                {trace.final_answer}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

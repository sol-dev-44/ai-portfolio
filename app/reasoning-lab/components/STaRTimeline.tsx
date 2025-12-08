'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Star, Info, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import STaRVisualization from './STaRVisualization';

interface STaRRound {
    round_number: number;
    num_traces: number;
    avg_score: number;
    improvement_pct?: number;
    traces?: any[];
}

interface STaRTimelineProps {
    rounds: STaRRound[];
    totalImprovement: number;
    problemText?: string;
    totalCost?: number;
    totalTokens?: number;
}

export default function STaRTimeline({ rounds, totalImprovement, problemText, totalCost, totalTokens }: STaRTimelineProps) {
    const [showEducation, setShowEducation] = useState(false);

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Experiment Summary
                </h3>

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

            {/* Final Solution */}
            {rounds.length > 0 && rounds[rounds.length - 1].traces && (() => {
                const finalRound = rounds[rounds.length - 1];
                const bestTrace = finalRound.traces
                    .filter((t: any) => t.is_golden)
                    .sort((a: any, b: any) => b.score - a.score)[0] || finalRound.traces[0];

                return (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                            <Star className="w-5 h-5 fill-current" />
                            Final Solution (Round {finalRound.round_number})
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-800 dark:text-green-200">
                                    <strong>Why this trace?</strong> Highest score ({bestTrace.score.toFixed(1)}/10) {bestTrace.is_golden && '• Marked as Golden'}
                                </span>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-700">
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Final Answer
                                </div>
                                <div className="text-base font-medium text-gray-900 dark:text-white">
                                    {bestTrace.final_answer}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()
            }

            {/* Educational Context - Expandable */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 overflow-hidden">
                <button
                    onClick={() => setShowEducation(!showEducation)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        How STaR Works
                    </h3>
                    {showEducation ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
                </button>

                <AnimatePresence>
                    {showEducation && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 space-y-4">
                                {/* Visual Flow Diagram */}
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">STaR Learning Loop</div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-2xl">🎲</span>
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">Generate</div>
                                            <div className="text-gray-500 dark:text-gray-400 mt-1">3 traces</div>
                                        </div>
                                        <div className="text-2xl text-blue-400">→</div>
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-2xl">⚖️</span>
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">Score</div>
                                            <div className="text-gray-500 dark:text-gray-400 mt-1">3 critics</div>
                                        </div>
                                        <div className="text-2xl text-blue-400">→</div>
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-2xl">⭐</span>
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">Select</div>
                                            <div className="text-gray-500 dark:text-gray-400 mt-1">Golden traces</div>
                                        </div>
                                        <div className="text-2xl text-blue-400">→</div>
                                        <div className="flex-1 text-center">
                                            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-2xl">🔄</span>
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">Learn</div>
                                            <div className="text-gray-500 dark:text-gray-400 mt-1">Next round</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Explanation */}
                                <div className="text-base text-blue-800 dark:text-blue-200 space-y-3 leading-relaxed">
                                    <p>
                                        <strong>Self-Taught Reasoner (STaR)</strong> simulates how AI models can improve through iterative self-reflection. Each round, the model generates multiple solutions, evaluates them, and uses the best ones to inform the next attempt.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <strong>Generation:</strong> The model attempts to solve the problem <strong>3 times per round</strong> (traces), each with slightly different reasoning paths.
                                        </li>
                                        <li>
                                            <strong>Scoring:</strong> Each trace is evaluated by 3 independent AI "Critics" that assess:
                                            <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs">
                                                <li><em>Clarity</em> - Is the reasoning clear and well-structured?</li>
                                                <li><em>Logic</em> - Are the steps logically sound?</li>
                                                <li><em>Efficiency</em> - Is it concise without unnecessary steps?</li>
                                            </ul>
                                            The final score is the average of these 3 critics (1-10 scale).
                                        </li>
                                        <li>
                                            <strong>Selection:</strong> "Golden Traces" are selected based on:
                                            <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs">
                                                <li>Score must be ≥ 6.0/10</li>
                                                <li>Top 50% of traces (or top 2, whichever is smaller)</li>
                                                <li>If no traces meet the threshold, the best one is selected anyway</li>
                                            </ul>
                                        </li>
                                        <li>
                                            <strong>Learning Loop:</strong> In real STaR training, golden traces are added to the model's training dataset. Here, we <em>simulate</em> this by using them as <strong>few-shot examples</strong> for the next round. The model "sees" what worked before and tries to replicate that success.
                                        </li>
                                    </ul>

                                    {/* Data Storage Note */}
                                    <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-700">
                                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">📊 Data Storage</div>
                                        <p className="text-xs">
                                            All traces, scores, and rounds are stored in <strong>Supabase</strong> for analysis and review. However, we're not actually fine-tuning the model weights—that would require GPU infrastructure and hours of training. Instead, we simulate the learning loop using few-shot prompting.
                                        </p>
                                    </div>

                                    <p className="text-xs italic mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                        💡 This is a <em>simulation</em> of the STaR training process. In production, you would fine-tune the model weights on the golden traces.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* D3 Visualization */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Reasoning Tree Visualization
                </h3>
                <STaRVisualization rounds={rounds} />
            </div>

            {/* Summary */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Improvement
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" />
                            {totalImprovement >= 0 ? '+' : ''}{totalImprovement.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {rounds.length} Rounds
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {rounds[0]?.avg_score.toFixed(2)} → {rounds[rounds.length - 1]?.avg_score.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rounds */}
            <div className="space-y-4">
                {rounds.map((round, idx) => (
                    <motion.div
                        key={round.round_number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        className="relative"
                    >
                        {/* Connector Line */}
                        {idx < rounds.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-100 dark:from-purple-700 dark:to-purple-900" />
                        )}

                        <div className="flex gap-4">
                            {/* Round Number Badge */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center border-2 border-purple-400 dark:border-purple-600">
                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {round.round_number}
                                </span>
                            </div>

                            {/* Round Content */}
                            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            Round {round.round_number}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {round.num_traces} traces generated
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {round.avg_score.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Avg Score
                                        </div>
                                    </div>
                                </div>

                                {round.improvement_pct !== undefined && round.improvement_pct !== null && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${round.improvement_pct >= 0
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                        }`}>
                                        <TrendingUp className={`w-4 h-4 ${round.improvement_pct < 0 ? 'rotate-180' : ''
                                            }`} />
                                        <span className="text-sm font-medium">
                                            {round.improvement_pct >= 0 ? '+' : ''}{round.improvement_pct.toFixed(1)}% vs Round {round.round_number - 1}
                                        </span>
                                    </div>
                                )}

                                {/* Golden Traces Count */}
                                {round.traces && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                        <span>
                                            {round.traces.filter((t: any) => t.is_golden).length} golden traces selected
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div >
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, BookOpen, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import ProblemInput from './components/ProblemInput';
import StrategySelector from './components/StrategySelector';
import ResultsDisplay from './components/ResultsDisplay';
import STaRTimeline from './components/STaRTimeline';
import { useRunReasoningMutation, useRunSTaRMutation } from '@/store/api/reasoningApi';

type AppState = 'input' | 'strategy' | 'running' | 'results';

export default function ReasoningLabPage() {
    const [showGuide, setShowGuide] = useState(false);
    const [state, setState] = useState<AppState>('input');
    const [problemId, setProblemId] = useState<string | null>(null);
    const [customQuestion, setCustomQuestion] = useState<string | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [results, setResults] = useState<any>(null);

    const [runReasoning, { isLoading: reasoningLoading }] = useRunReasoningMutation();
    const [runSTaR, { isLoading: starLoading }] = useRunSTaRMutation();

    const isLoading = reasoningLoading || starLoading;

    const handleProblemSubmit = (probId: string | null, custQ: string | null) => {
        setProblemId(probId);
        setCustomQuestion(custQ);
        setState('strategy');
    };

    const handleStrategySelect = async (strategy: string, model: string) => {
        setSelectedStrategy(strategy);
        setState('running');

        try {
            if (strategy === 'star') {
                const response = await runSTaR({
                    problem_id: problemId || undefined,
                    custom_question: customQuestion || undefined,
                    num_rounds: 3,
                    traces_per_round: 3,
                    model: model,
                }).unwrap();
                setResults(response);
            } else {
                const response = await runReasoning({
                    problem_id: problemId || undefined,
                    custom_question: customQuestion || undefined,
                    strategy: strategy as 'zero_shot_cot' | 'self_consistency',
                    n_traces: strategy === 'self_consistency' ? 5 : 1,
                    model: model,
                }).unwrap();
                setResults(response);
            }
            setState('results');
        } catch (error) {
            console.error('Error running reasoning:', error);
            alert('Failed to run reasoning. Make sure backend is running and Supabase schema is created.');
            setState('strategy');
        }
    };

    const handleReset = () => {
        setState('strategy'); // Go back to strategy selection, not input
        setSelectedStrategy('');
        setResults(null);
    };

    return (
        <main className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                Deep Reasoner Lab
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Explore inference-time reasoning strategies and STaR simulation
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {state === 'results' && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                New Experiment
                            </button>
                        )}
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            How It Works
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <AnimatePresence mode="wait">
                        {state === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <ProblemInput onSubmit={handleProblemSubmit} isLoading={false} />
                            </motion.div>
                        )}

                        {state === 'strategy' && (
                            <motion.div
                                key="strategy"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <button
                                    onClick={() => setState('input')}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                >
                                    ← Back to problem
                                </button>
                                <StrategySelector onSelect={handleStrategySelect} disabled={isLoading} />
                            </motion.div>
                        )}

                        {state === 'running' && (
                            <motion.div
                                key="running"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-16"
                            >
                                <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    Running {selectedStrategy === 'star' ? 'STaR Simulation' : 'Reasoning Strategy'}...
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    This may take {selectedStrategy === 'star' ? '2-3 minutes' : '10-30 seconds'}
                                </p>
                            </motion.div>
                        )}

                        {state === 'results' && results && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {selectedStrategy === 'star' && results.rounds ? (
                                    <STaRTimeline
                                        rounds={results.rounds}
                                        totalImprovement={results.total_improvement_pct}
                                        problemText={results.problem_text}
                                        totalCost={results.total_cost}
                                        totalTokens={results.total_tokens}
                                    />
                                ) : (
                                    <ResultsDisplay
                                        traces={results.traces}
                                        strategy={selectedStrategy}
                                        problemText={results.problem_text}
                                        totalCost={results.total_cost}
                                        totalTokens={results.total_tokens}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Guide Modal - (same as before) */}
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowGuide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    About Deep Reasoner Lab
                                </h2>
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)] space-y-4">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                        What is this?
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        An interactive playground for exploring <strong>inference-time reasoning</strong> techniques
                                        that make LLMs smarter without retraining them.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Key Features</h3>

                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                            🧠 Multiple Reasoning Strategies
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Compare zero-shot CoT, self-consistency, and sequential revision side-by-side
                                        </p>
                                    </div>

                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                            ✨ STaR Simulation
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Watch reasoning improve across 3 rounds as golden traces are selected and reused
                                        </p>
                                    </div>

                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                            📊 Reward Model Scoring
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            See how traces are scored using simulated Process Reward Models (PRM)
                                        </p>
                                    </div>

                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                            🌳 Tree Visualization
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Interactive D3.js graphs showing reasoning paths and score improvements
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                                        How STaR Works
                                    </div>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Round 1: Generate 10 chains → Score → Select top 3. Round 2: Use golden traces as examples → Generate 10 new → Score. Round 3: Repeat, observe improvement!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}

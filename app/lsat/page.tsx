'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import StrategyPanel from '@/components/lsat/StrategyPanel';
import {
    Brain,
    Database,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Sparkles,
    Scale,
    BookOpen,
    Target,
    Lightbulb,
    AlertTriangle,
    Clock,
    BarChart2,
    Search,
    Filter,
    Download,
    Zap,
    Server,
    FileJson
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface LSATQuestion {
    id: string;
    context: string;
    question: string;
    options: string[];
    answer?: string | number;
    dataset?: string;
}

interface AnalysisBreakdown {
    setup: string;
    question_stem: string;
    key_constraints: string[];
    logical_chain: string[];
}

interface CorrectAnswer {
    letter: string;
    explanation: string;
    key_insight: string;
}

interface IncorrectAnswer {
    letter: string;
    reason: string;
}

interface PatternAnalysis {
    pattern_type: string;
    confidence: number;
    breakdown: AnalysisBreakdown;
    correct_answer: CorrectAnswer;
    incorrect_answers: IncorrectAnswer[];
    pattern_recognition_tips: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    time_estimate_seconds: number;
}

interface CacheStats {
    pattern_analyses_cached?: number;
    local_cache_size?: number;
    rag_patterns_indexed?: number;
    rag_examples_indexed?: number;
}

// =============================================================================
// PATTERN COLORS & ICONS
// =============================================================================

const PATTERN_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    sequencing: { color: 'blue', icon: <BarChart2 className="w-4 h-4" />, label: 'Sequencing' },
    grouping: { color: 'green', icon: <Filter className="w-4 h-4" />, label: 'Grouping' },
    matching: { color: 'purple', icon: <Target className="w-4 h-4" />, label: 'Matching' },
    hybrid: { color: 'orange', icon: <Zap className="w-4 h-4" />, label: 'Hybrid' },
    strengthen: { color: 'emerald', icon: <ChevronUp className="w-4 h-4" />, label: 'Strengthen' },
    weaken: { color: 'red', icon: <ChevronDown className="w-4 h-4" />, label: 'Weaken' },
    assumption: { color: 'indigo', icon: <Lightbulb className="w-4 h-4" />, label: 'Assumption' },
    inference: { color: 'cyan', icon: <Brain className="w-4 h-4" />, label: 'Inference' },
    flaw: { color: 'rose', icon: <AlertTriangle className="w-4 h-4" />, label: 'Flaw' },
    parallel: { color: 'amber', icon: <Scale className="w-4 h-4" />, label: 'Parallel' },
    principle: { color: 'teal', icon: <BookOpen className="w-4 h-4" />, label: 'Principle' },
    resolve: { color: 'lime', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Resolve' },
    evaluate: { color: 'violet', icon: <Search className="w-4 h-4" />, label: 'Evaluate' },
};

const DIFFICULTY_COLORS = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

// =============================================================================
// API HOOKS
// =============================================================================

function useLSATService() {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/lsat?action=stats');
            if (res.ok) {
                const data = await res.json();
                setCacheStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchQuestions = useCallback(async (count: number = 5): Promise<LSATQuestion[]> => {
        setLoading(true);
        try {
            const res = await fetch('/api/lsat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch_questions', count })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to fetch questions');
            }

            const data = await res.json();
            return data.questions || [];
        } finally {
            setLoading(false);
        }
    }, []);

    const analyzeQuestion = useCallback(async (
        question: LSATQuestion,
        onText: (text: string) => void,
        onComplete: (analysis: PatternAnalysis | null, fromCache: boolean) => void,
        onError: (error: string) => void
    ) => {
        try {
            const res = await fetch('/api/lsat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    stream: true,
                    useCache: true,
                    useRag: true
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Analysis failed');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);

                        if (data.type === 'cached') {
                            onComplete(data.analysis, true);
                            return;
                        }

                        if (data.type === 'text') {
                            const text = data.content || '';
                            fullText += text;
                            onText(text);
                        }

                        if (data.type === 'complete') {
                            try {
                                const analysis = JSON.parse(data.full_text || fullText);
                                onComplete(analysis, false);
                            } catch {
                                // Try to extract JSON
                                const jsonMatch = (data.full_text || fullText).match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    const analysis = JSON.parse(jsonMatch[0]);
                                    onComplete(analysis, false);
                                } else {
                                    onComplete(null, false);
                                }
                            }
                        }

                        if (data.type === 'error') {
                            onError(data.content || 'Unknown error');
                        }
                    } catch (e) {
                        // Continue on parse errors
                    }
                }
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Unknown error');
        }
    }, []);

    return { cacheStats, fetchStats, fetchQuestions, analyzeQuestion, loading };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function PatternBadge({ pattern, confidence }: { pattern: string; confidence?: number }) {
    const style = PATTERN_STYLES[pattern.toLowerCase()] || PATTERN_STYLES.inference;

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-${style.color}-100 dark:bg-${style.color}-900/30 text-${style.color}-700 dark:text-${style.color}-300 text-sm font-medium`}>
            {style.icon}
            <span>{style.label}</span>
            {confidence !== undefined && (
                <span className="ml-1 opacity-70">({Math.round(confidence * 100)}%)</span>
            )}
        </div>
    );
}

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[difficulty]}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
    );
}

function CacheIndicator({ fromCache, cacheKey }: { fromCache: boolean; cacheKey?: string }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${fromCache
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
            {fromCache ? (
                <>
                    <Database className="w-3 h-3" />
                    <span>Cached</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-3 h-3" />
                    <span>Fresh Analysis</span>
                </>
            )}
        </div>
    );
}

function QuestionCard({
    question,
    selected,
    onSelect,
    analysis
}: {
    question: LSATQuestion;
    selected: boolean;
    onSelect: () => void;
    analysis?: PatternAnalysis | null;
}) {
    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${selected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {question.question}
                </p>
                {analysis && (
                    <PatternBadge pattern={analysis.pattern_type} />
                )}
            </div>

            {question.context && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {question.context.substring(0, 100)}...
                </p>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>{question.options?.length || 0} options</span>
                {question.answer !== undefined && (
                    <span className="text-green-600 dark:text-green-400">
                        Answer: {typeof question.answer === 'number' ? String.fromCharCode(65 + question.answer) : question.answer}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function AnalysisPanel({
    analysis,
    rawText,
    loading,
    fromCache,
    question,
    onGetStrategy
}: {
    analysis: PatternAnalysis | null;
    rawText: string;
    loading: boolean;
    fromCache: boolean;
    question: LSATQuestion | null;
    onGetStrategy?: (questionType: string) => void;
}) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['breakdown', 'correct', 'tips'])
    );

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    if (loading && !rawText && !analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Analyzing question...</p>
            </div>
        );
    }

    if (!analysis && !rawText) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Brain className="w-12 h-12 mb-2 opacity-30" />
                <p>Select a question and click Analyze</p>
            </div>
        );
    }

    // Show streaming text while loading
    if (loading && rawText && !analysis) {
        return (
            <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-500">Analyzing with RAG context...</span>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                    {rawText}
                </pre>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <PatternBadge pattern={analysis.pattern_type} confidence={analysis.confidence} />
                    <DifficultyBadge difficulty={analysis.difficulty} />
                </div>
                <div className="flex items-center gap-2">
                    <CacheIndicator fromCache={fromCache} />
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>~{analysis.time_estimate_seconds}s</span>
                    </div>
                </div>
            </div>

            {/* Get Strategy Button */}
            {onGetStrategy && (
                <button
                    onClick={() => onGetStrategy(analysis.pattern_type)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all"
                >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">📚 Get Strategy for {PATTERN_STYLES[analysis.pattern_type.toLowerCase()]?.label || analysis.pattern_type}</span>
                </button>
            )}

            {/* Breakdown Section */}
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('breakdown')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <div className="flex items-center gap-2 font-medium">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Breakdown</span>
                    </div>
                    {expandedSections.has('breakdown') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {expandedSections.has('breakdown') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 space-y-3"
                        >
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Setup</h4>
                                <p className="text-sm">{analysis.breakdown.setup}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Question Stem</h4>
                                <p className="text-sm">{analysis.breakdown.question_stem}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Constraints</h4>
                                <ul className="text-sm space-y-1">
                                    {analysis.breakdown.key_constraints.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Logical Chain</h4>
                                <ol className="text-sm space-y-1">
                                    {analysis.breakdown.logical_chain.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-green-500 font-mono text-xs">{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Correct Answer Section */}
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden border-green-200 dark:border-green-800">
                <button
                    onClick={() => toggleSection('correct')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                    <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct Answer: {analysis.correct_answer.letter}</span>
                    </div>
                    {expandedSections.has('correct') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {expandedSections.has('correct') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 space-y-3"
                        >
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Explanation</h4>
                                <p className="text-sm">{analysis.correct_answer.explanation}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-1">
                                    💡 Key Insight
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {analysis.correct_answer.key_insight}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Incorrect Answers Section */}
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('incorrect')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Why Others Are Wrong</span>
                    </div>
                    {expandedSections.has('incorrect') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {expandedSections.has('incorrect') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 space-y-2"
                        >
                            {analysis.incorrect_answers.map((ans, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="font-semibold text-red-500">{ans.letter}:</span>
                                    <span className="text-gray-700 dark:text-gray-300">{ans.reason}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pattern Recognition Tips */}
            <div className="border rounded-lg dark:border-gray-700 overflow-hidden border-amber-200 dark:border-amber-800">
                <button
                    onClick={() => toggleSection('tips')}
                    className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                    <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                        <Lightbulb className="w-4 h-4" />
                        <span>Pattern Recognition Tips</span>
                    </div>
                    {expandedSections.has('tips') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {expandedSections.has('tips') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4"
                        >
                            <ul className="space-y-2">
                                {analysis.pattern_recognition_tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <span className="text-amber-500">→</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}

function StatsBar({ stats, onRefresh }: { stats: CacheStats | null; onRefresh: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    <span>Cache: {stats?.pattern_analyses_cached ?? stats?.local_cache_size ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    <span>RAG Patterns: {stats?.rag_patterns_indexed ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    <FileJson className="w-4 h-4" />
                    <span>Examples: {stats?.rag_examples_indexed ?? 0}</span>
                </div>
            </div>
            <button
                onClick={onRefresh}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LSATAnalyzer() {
    const { cacheStats, fetchStats, fetchQuestions, analyzeQuestion, loading } = useLSATService();

    const [questions, setQuestions] = useState<LSATQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<LSATQuestion | null>(null);
    const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
    const [rawText, setRawText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [fromCache, setFromCache] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(5);
    const [showStrategy, setShowStrategy] = useState(false);
    const [strategyType, setStrategyType] = useState<string | undefined>();

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleFetchQuestions = async () => {
        setError(null);
        try {
            const qs = await fetchQuestions(questionCount);
            setQuestions(qs);
            setSelectedQuestion(null);
            setAnalysis(null);
            setRawText('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch questions');
        }
    };

    const handleAnalyze = async () => {
        if (!selectedQuestion) return;

        setAnalyzing(true);
        setAnalysis(null);
        setRawText('');
        setFromCache(false);
        setError(null);

        await analyzeQuestion(
            selectedQuestion,
            (text) => setRawText(prev => prev + text),
            (result, cached) => {
                setAnalysis(result);
                setFromCache(cached);
                setAnalyzing(false);
                fetchStats(); // Refresh stats after analysis
            },
            (err) => {
                setError(err);
                setAnalyzing(false);
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Scale className="w-7 h-7 text-blue-500" />
                        LSAT Pattern Analyzer
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        AI-powered analysis with RAG-enhanced pattern recognition and caching
                    </p>
                </div>

                {/* Stats Bar */}
                <StatsBar stats={cacheStats} onRefresh={fetchStats} />

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel - Questions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Questions</h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    {[5, 10, 15, 20].map(n => (
                                        <option key={n} value={n}>{n} questions</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleFetchQuestions}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Fetch
                                </button>
                            </div>
                        </div>

                        {/* Question List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {questions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>Click "Fetch" to load LSAT questions</p>
                                </div>
                            ) : (
                                questions.map((q) => (
                                    <QuestionCard
                                        key={q.id}
                                        question={q}
                                        selected={selectedQuestion?.id === q.id}
                                        onSelect={() => setSelectedQuestion(q)}
                                        analysis={selectedQuestion?.id === q.id ? analysis : undefined}
                                    />
                                ))
                            )}
                        </div>

                        {/* Analyze Button */}
                        {selectedQuestion && (
                            <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5" />
                                            Analyze with RAG
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Analysis */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Analysis
                        </h2>

                        <AnalysisPanel
                            analysis={analysis}
                            rawText={rawText}
                            loading={analyzing}
                            fromCache={fromCache}
                            question={selectedQuestion}
                            onGetStrategy={(type) => {
                                setStrategyType(type);
                                setShowStrategy(true);
                            }}
                        />
                    </div>
                </div>

                {/* Selected Question Detail */}
                {selectedQuestion && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Selected Question
                        </h3>
                        <div className="space-y-3">
                            {selectedQuestion.context && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Context</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedQuestion.context}
                                    </p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Question</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {selectedQuestion.question}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Options</h4>
                                <ul className="text-sm space-y-1">
                                    {selectedQuestion.options?.map((opt, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="font-semibold text-blue-500">
                                                {String.fromCharCode(65 + i)}.
                                            </span>
                                            <span className={
                                                selectedQuestion.answer !== undefined &&
                                                    (selectedQuestion.answer === i || selectedQuestion.answer === String.fromCharCode(65 + i))
                                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                                    : ''
                                            }>
                                                {opt}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Strategy Panel Modal */}
                {showStrategy && (
                    <StrategyPanel
                        questionType={strategyType}
                        onClose={() => setShowStrategy(false)}
                    />
                )}
            </div>
        </div>
    );
}
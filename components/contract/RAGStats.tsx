import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Database, FileText, ChevronDown, ChevronUp, BrainCircuit, ArrowRight, Sparkles, TrendingUp, Zap, CheckCircle2, Code } from 'lucide-react';

interface RAGStatsProps {
    stats: {
        risk_definitions: number;
        analyzed_contracts: number;
        total_documents: number;
    } | null;
}

export default function RAGStats({ stats }: RAGStatsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            {/* Header / Stats Bar */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            RAG Knowledge Base
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                Active
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Trained on {stats?.total_documents || 0} documents • Click to learn how it works
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">{stats?.risk_definitions || 0}</span>
                            <span className="text-gray-500">Definitions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">{stats?.analyzed_contracts || 0}</span>
                            <span className="text-gray-500">Examples</span>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Expandable Educational Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30"
                    >
                        <div className="p-6 space-y-8">
                            {/* Visual Flow Diagram */}
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    How RAG Powers This Contract Auditor
                                </h4>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {/* Step 1 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="relative bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 shadow-sm"
                                    >
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                            1
                                        </div>
                                        <div className="mb-3">
                                            <Database className="w-8 h-8 text-blue-500 mb-2" />
                                            <h5 className="font-bold text-gray-900 dark:text-white">Retrieval</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            When you upload a contract, the system searches its knowledge base for:
                                        </p>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Relevant risk definitions</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Similar past contracts</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Common clause patterns</span>
                                            </li>
                                        </ul>
                                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block">
                                            <ArrowRight className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    </motion.div>

                                    {/* Step 2 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="relative bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800 shadow-sm"
                                    >
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                            2
                                        </div>
                                        <div className="mb-3">
                                            <Zap className="w-8 h-8 text-purple-500 mb-2" />
                                            <h5 className="font-bold text-gray-900 dark:text-white">Augmentation</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Retrieved context is injected into the AI prompt:
                                        </p>
                                        <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                            <code className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                "Based on {stats?.risk_definitions || 0} risk definitions and {stats?.analyzed_contracts || 0} past examples, analyze this contract..."
                                            </code>
                                        </div>
                                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block">
                                            <ArrowRight className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    </motion.div>

                                    {/* Step 3 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="relative bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-green-200 dark:border-green-800 shadow-sm"
                                    >
                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                            3
                                        </div>
                                        <div className="mb-3">
                                            <BrainCircuit className="w-8 h-8 text-green-500 mb-2" />
                                            <h5 className="font-bold text-gray-900 dark:text-white">Generation</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Claude analyzes your contract with specialized legal knowledge:
                                        </p>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Identifies risks</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Assigns severity scores</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Suggests improvements</span>
                                            </li>
                                        </ul>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Training Process */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                    <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-orange-500" />
                                        Continuous Learning Process
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                        The system automatically improves with every contract you analyze:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                A
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Analysis Storage</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Each analyzed contract is indexed with its identified risks and patterns</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                B
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Feedback Integration</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Your corrections and feedback refine the risk definitions</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                C
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Pattern Recognition</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Similar clauses in future contracts are flagged more accurately</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                    <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-blue-500" />
                                        Knowledge Base Status
                                    </h5>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Definitions</span>
                                                <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">{stats?.risk_definitions || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Pre-loaded legal risk patterns
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzed Contracts</span>
                                                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{stats?.analyzed_contracts || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(((stats?.analyzed_contracts || 0) / 50) * 100, 100)}%` }}
                                                    transition={{ duration: 1, delay: 0.7 }}
                                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {stats?.analyzed_contracts || 0} / 50 contracts analyzed (grows with use)
                                            </p>
                                        </div>

                                        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Every analysis makes the next one smarter!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Why RAG Matters */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-500" />
                                    Why RAG Makes This Better Than Standard AI
                                </h5>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">🎯 Domain-Specific</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Focuses on legal contract risks, not general knowledge
                                        </p>
                                    </div>
                                    <div>
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">📈 Always Improving</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Learns from your feedback and past analyses
                                        </p>
                                    </div>
                                    <div>
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">🔍 Transparent</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            You can see what knowledge informed each analysis
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Deep Dive */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Code className="w-5 h-5 text-indigo-500" />
                                    Technical Deep Dive: How Retrieval Works
                                </h5>
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <span className="text-indigo-500">⚡</span> Current Implementation: Keyword Matching
                                        </h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                            This demo uses simple keyword-based search for speed and simplicity:
                                        </p>
                                        <code className="block text-xs bg-white dark:bg-gray-950 p-3 rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono">
                                            score = sum(1 for word in query if word in document)
                                        </code>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <span className="text-purple-500">🚀</span> Production RAG: Semantic Search with Embeddings
                                        </h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                            Production systems use <strong>vector embeddings</strong> to understand semantic meaning:
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2 items-start">
                                                <span className="text-purple-500 font-bold text-xs">1.</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">Text → Vectors</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Convert text to high-dimensional vectors (e.g., 1536 dimensions) using models like OpenAI's text-embedding-3
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-start">
                                                <span className="text-purple-500 font-bold text-xs">2.</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">Vector Database</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Store in specialized DBs (Pinecone, Weaviate, pgvector) optimized for similarity search
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-start">
                                                <span className="text-purple-500 font-bold text-xs">3.</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">Cosine Similarity</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Find semantically similar documents even if they use different words
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 p-2 bg-white dark:bg-gray-950 rounded border border-purple-200 dark:border-purple-800">
                                            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                                                💡 Example: "liability clause" would match "indemnification provision" semantically
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3 text-xs">
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Keyword Matching</p>
                                            <p className="text-gray-600 dark:text-gray-400 mb-2">✅ Fast, simple, no API costs</p>
                                            <p className="text-gray-600 dark:text-gray-400">❌ Misses semantic similarity</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Vector Embeddings</p>
                                            <p className="text-gray-600 dark:text-gray-400 mb-2">✅ Understands meaning & context</p>
                                            <p className="text-gray-600 dark:text-gray-400">❌ Requires embedding API & vector DB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

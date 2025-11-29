import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Database, FileText, ChevronDown, ChevronUp, BrainCircuit, ArrowRight, Sparkles, TrendingUp, Zap, CheckCircle2, Code, Server, Cpu, GitBranch } from 'lucide-react';

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
            {/* Header with Stats */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            RAG Knowledge Base
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                Live
                            </span>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                                Vector Search
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {stats?.total_documents || 0} documents indexed with semantic embeddings
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{stats?.risk_definitions || 0}</span>
                        <span className="text-gray-500">Risk Types</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{stats?.analyzed_contracts || 0}</span>
                        <span className="text-gray-500">Learned Contracts</span>
                    </div>
                </div>
            </div>

            {/* Educational CTA Banner */}
            <div
                className="px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{
                                scale: isExpanded ? 1 : [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: isExpanded ? 0 : Infinity,
                                repeatType: "reverse"
                            }}
                            className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-md"
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {isExpanded ? "Understanding RAG Architecture" : "Learn how RAG makes this AI smarter"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isExpanded
                                    ? "Explore the vector search pipeline and continuous learning system"
                                    : "See how vector embeddings, Supabase, and Claude work together"}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isExpanded
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg"
                            }`}
                    >
                        {isExpanded ? (
                            <>
                                <span>Collapse</span>
                                <ChevronUp className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <span>Explore</span>
                                <ChevronDown className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
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
                                            <h5 className="font-bold text-gray-900 dark:text-white">Semantic Retrieval</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Your contract is converted to a vector embedding and matched against:
                                        </p>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{stats?.risk_definitions || 0} risk definitions with embeddings</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{stats?.analyzed_contracts || 0} previously analyzed contracts</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Cosine similarity matching</span>
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
                                            <BrainCircuit className="w-8 h-8 text-purple-500 mb-2" />
                                            <h5 className="font-bold text-gray-900 dark:text-white">Augmented Generation</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Claude receives your contract plus relevant context:
                                        </p>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Top matching risk definitions</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Similar contract analyses</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Mitigation strategies that worked</span>
                                            </li>
                                        </ul>
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
                                            <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                                            <h5 className="font-bold text-gray-900 dark:text-white">Continuous Learning</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Every analysis improves the system:
                                        </p>
                                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Contract auto-indexed to Supabase</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Embeddings stored for future matching</span>
                                            </li>
                                            <li className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Risk patterns learned over time</span>
                                            </li>
                                        </ul>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-indigo-500" />
                                    Production Tech Stack
                                </h5>
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                <Database className="w-4 h-4 text-green-600" />
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">Supabase</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            PostgreSQL + pgvector for vector storage and similarity search
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                <Cpu className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">OpenAI</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            text-embedding-3-small for 1536-dimension vectors
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                                <BrainCircuit className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">Claude</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Sonnet for analysis with RAG-augmented context
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">FastAPI</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Async Python backend with background tasks
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Why RAG Section */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-green-500" />
                                    Why RAG Makes This Better Than Standard AI
                                </h5>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">🎯 Domain-Specific</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {stats?.risk_definitions || 0} specialized risk definitions with indicators and mitigation strategies
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">📈 Self-Improving</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Every contract analyzed is automatically embedded and indexed for future reference
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">🔍 Semantic Understanding</h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Finds similar risks even when contracts use different terminology
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Deep Dive */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Code className="w-5 h-5 text-indigo-500" />
                                    Technical Deep Dive: Vector Search
                                </h5>
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <span className="text-indigo-500">⚡</span> How Semantic Search Works
                                        </h6>
                                        <div className="space-y-3">
                                            <div className="flex gap-2 items-start">
                                                <span className="text-indigo-500 font-bold text-xs bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">1</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">Text → Vector Embedding</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Contract text is converted to a 1536-dimensional vector using OpenAI's text-embedding-3-small
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-start">
                                                <span className="text-indigo-500 font-bold text-xs bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">2</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">pgvector Similarity Search</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Supabase uses cosine distance to find the most similar documents in milliseconds
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-start">
                                                <span className="text-indigo-500 font-bold text-xs bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">3</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">Context Injection</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Top matches are injected into Claude's prompt for domain-aware analysis
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-purple-500" />
                                            Database Schema
                                        </h6>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <div className="bg-white dark:bg-gray-950 rounded p-3 border border-purple-200 dark:border-purple-800">
                                                <p className="text-xs font-mono font-semibold text-purple-700 dark:text-purple-300 mb-1">contract_risks</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Risk definitions with embeddings, indicators, and mitigation strategies
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-950 rounded p-3 border border-purple-200 dark:border-purple-800">
                                                <p className="text-xs font-mono font-semibold text-purple-700 dark:text-purple-300 mb-1">contract_examples</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Analyzed contracts with embeddings for similarity matching
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Example: "liability clause" semantically matches "indemnification provision" even though they use different words
                                        </p>
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
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Database, Sparkles, Brain, Code2, Zap } from 'lucide-react';

export default function TechnicalGuide() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mb-12">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-lg">
                        🧑‍💻 How This Was Built (Technical Deep Dive)
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mt-4">
                            {/* Architecture Overview */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                    Architecture Overview
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    This is a <strong>production-grade RAG (Retrieval-Augmented Generation)</strong> system that uses semantic search and embeddings to match users with ideal dog breeds. It's built with the same infrastructure used by companies like Perplexity and OpenAI.
                                </p>

                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 mb-4">
                                    <code className="text-sm text-gray-800 dark:text-gray-200">
                                        Quiz Answers → Text Profile → OpenAI Embedding (1536d) → Supabase pgvector → Semantic Search → Top 5 Matches
                                    </code>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-600" />
                                    Tech Stack
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Backend</h4>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• <strong>FastAPI</strong> - Python REST API</li>
                                                <li>• <strong>OpenAI API</strong> - text-embedding-3-small (1536 dimensions)</li>
                                                <li>• <strong>Supabase</strong> - PostgreSQL with pgvector extension</li>
                                                <li>• <strong>Async scraping</strong> - aiohttp for parallel data fetching</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Frontend</h4>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• <strong>Next.js 14</strong> - App Router</li>
                                                <li>• <strong>TypeScript</strong> - Type safety</li>
                                                <li>• <strong>Framer Motion</strong> - Smooth animations</li>
                                                <li>• <strong>Tailwind CSS</strong> - Styling</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Data Pipeline</h4>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• <strong>dogapi.dog</strong> - 283 breed profiles</li>
                                                <li>• <strong>dog.ceo</strong> - Breed images</li>
                                                <li>• <strong>Smart inference</strong> - Extracts attributes from descriptions</li>
                                                <li>• <strong>Embeddings</strong> - Rich text profiles → vectors</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-2">Database</h4>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• <strong>pgvector</strong> - Vector similarity search</li>
                                                <li>• <strong>IVFFlat index</strong> - Fast approximate search</li>
                                                <li>• <strong>Cosine similarity</strong> - Match scoring</li>
                                                <li>• <strong>RPC functions</strong> - Custom SQL queries</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Features */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-yellow-500" />
                                    Key Technical Features
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">1. Intelligent Attribute Inference</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Instead of manual data entry, the scraper <strong>reads breed descriptions</strong> and uses keyword analysis to extract:
                                        </p>
                                        <code className="text-xs bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded block">
                                            "energetic" → High Energy | "apartment" → Apartment Friendly | "intelligent" → Highly Trainable
                                        </code>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">2. Semantic Matching (Not Rule-Based)</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Traditional systems use if/else filters. This uses <strong>embeddings</strong> to understand nuanced compatibility.
                                            For example, "active couple in apartment" semantically matches breeds that are "energetic but adaptable to smaller spaces."
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">3. Explainable AI</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            Every match includes <strong>human-readable reasoning</strong>:
                                        </p>
                                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                            <li>✓ "Perfect small size match"</li>
                                            <li>✓ "Apartment-friendly breed"</li>
                                            <li>✓ "High energy matches your lifestyle"</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">4. Beautiful Placeholders</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            For breeds without photos, generates <strong>gradient placeholders</strong> with breed initials, size-coded colors (rose/blue/emerald),
                                            animated patterns, and glassmorphism effects.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Database className="w-6 h-6 text-indigo-600" />
                                    How Matching Works
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                                            1
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Quiz → Text Profile</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Your answers are converted to natural language: "Lives in apartment, moderately active, first-time owner, prefers small dogs..."
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400">
                                            2
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Generate Embedding</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                OpenAI converts your profile into a 1536-dimensional vector that captures semantic meaning.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                                            3
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Vector Similarity Search</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Supabase pgvector finds the 5 breed profiles with the highest cosine similarity to your vector.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400">
                                            4
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Generate Explanations</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Backend analyzes the match to generate specific reasons why each breed suits your lifestyle.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/30 rounded-lg">
                                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">283</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Dog Breeds</div>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">1536</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Embedding Dims</div>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/30 rounded-lg">
                                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">&lt;200ms</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Match Query</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

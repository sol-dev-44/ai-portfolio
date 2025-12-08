'use client';

// app/snapfix/page.tsx
// Main SnapFix interface - AI Diagno
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, BookOpen, Layers } from 'lucide-react';
import AnalyzerView from './components/AnalyzerView';
import TrainerView from './components/TrainerView';
import ArchitectureView from './components/ArchitectureView';

export default function SnapFixPage() {
    const [activeTab, setActiveTab] = useState<'analyzer' | 'trainer' | 'architecture'>('analyzer');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />

                <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6 shadow-lg backdrop-blur-sm"
                    >
                        <Wrench className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-6 tracking-tight"
                    >
                        SnapFix AI
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                        Your intelligent repair assistant. Upload a photo, and our multi-agent system will diagnose the issue and guide you to a fix.
                    </motion.p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center -mb-px relative z-10">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('analyzer')}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'analyzer'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Wrench className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'analyzer' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                            AI Analyzer
                        </button>

                        <button
                            onClick={() => setActiveTab('trainer')}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'trainer'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <BookOpen className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'trainer' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                            Knowledge Trainer
                        </button>

                        <button
                            onClick={() => setActiveTab('architecture')}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'architecture'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Layers className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'architecture' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                            System Architecture
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'analyzer' && (
                        <motion.div
                            key="analyzer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="max-w-4xl mx-auto">
                                <AnalyzerView />
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'trainer' && (
                        <motion.div
                            key="trainer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="max-w-4xl mx-auto">
                                <TrainerView />
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'architecture' && (
                        <motion.div
                            key="architecture"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ArchitectureView />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Disclaimer Footer */}
                <div className="mt-16 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                        Disclaimer: SnapFix AI provides suggestions based on image analysis. Always consult a professional for dangerous repairs involving electricity, gas, or structural integrity.
                    </p>
                </div>
            </main>
        </div>
    );
}

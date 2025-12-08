'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Link as LinkIcon, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function TrainerView() {
    const [mode, setMode] = useState<'text' | 'url'>('text');
    const [content, setContent] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsTraining(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch('/api/snapfix/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: mode,
                    content: content
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Training failed');

            setStatus('success');
            setMessage(`Successfully ingested ${data.chunks} chunks from ${mode === 'url' ? 'URL' : 'text source'}.`);
            setContent('');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to ingest content');
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Knowledge Base Trainer</h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Teach SnapFix new repair skills by adding documentation or web guides.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setMode('text')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'text'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Paste Text
                        </span>
                    </button>
                    <button
                        onClick={() => setMode('url')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'url'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Scrape URL
                        </span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                    {mode === 'text' ? (
                        <motion.div
                            key="text-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Repair Guide Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste the full text of a repair manual, guide, or tutorial here..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-64 font-mono text-sm"
                                required
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="url-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Article URL
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="https://example.com/how-to-fix-leaky-faucet"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Note: Only the content of this specific page will be ingested.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    disabled={isTraining || !content.trim()}
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-0.5
                        ${isTraining || !content.trim()
                            ? 'bg-gray-400 cursor-not-allowed transform-none'
                            : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 hover:shadow-xl'
                        }
                    `}
                >
                    {isTraining ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Ingesting Knowledge...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Database className="w-5 h-5" />
                            Add to Knowledge Base
                        </span>
                    )}
                </button>
            </form>

            {/* Status Messages */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`rounded-xl p-4 flex items-start gap-3 border ${status === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            }`}
                    >
                        {status === 'success' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <h3 className="font-medium">
                                {status === 'success' ? 'Training Complete' : 'Training Failed'}
                            </h3>
                            <p className="text-sm opacity-90">{message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

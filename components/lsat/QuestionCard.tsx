'use client';

import React from 'react';
import { LSATQuestion } from '@/store/api/lsatApi';
import { motion } from 'framer-motion';

interface QuestionCardProps {
    question: LSATQuestion;
    onAnalyze: () => void;
    isAnalyzing: boolean;
}

export function QuestionCard({ question, onAnalyze, isAnalyzing }: QuestionCardProps) {
    const [selectedOption, setSelectedOption] = React.useState<number | null>(null);

    // Reset selection when question changes
    React.useEffect(() => {
        setSelectedOption(null);
    }, [question.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm h-full flex flex-col overflow-y-auto">
            <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                    {question.dataset}
                </span>

                {question.context && (
                    <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed font-serif text-lg">
                        {question.context}
                    </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-snug">
                    {question.question}
                </h2>
            </div>

            <div className="space-y-3 flex-grow">
                {question.options.map((option, index) => (
                    <motion.button
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedOption(index)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedOption === index
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${selectedOption === index
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'text-gray-500 border-gray-300 dark:border-gray-600'
                                }`}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing || selectedOption === null}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${isAnalyzing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedOption !== null
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        }`}
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing Logic Pattern...
                        </>
                    ) : (
                        <>
                            Analyze Logic Pattern
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useGetProblemsQuery } from '@/store/api/reasoningApi';

interface ProblemInputProps {
    onSubmit: (problemId: string | null, customQuestion: string | null) => void;
    isLoading: boolean;
}

export default function ProblemInput({ onSubmit, isLoading }: ProblemInputProps) {
    const [mode, setMode] = useState<'library' | 'custom'>('library');
    const [selectedProblemId, setSelectedProblemId] = useState<string>('');
    const [customQuestion, setCustomQuestion] = useState('');

    const { data: problemsData, isLoading: loadingProblems } = useGetProblemsQuery();
    const problems = problemsData?.problems || [];

    const handleSubmit = () => {
        if (mode === 'library' && selectedProblemId) {
            onSubmit(selectedProblemId, null);
        } else if (mode === 'custom' && customQuestion.trim()) {
            onSubmit(null, customQuestion);
        }
    };

    const canSubmit = mode === 'library' ? !!selectedProblemId : customQuestion.trim().length > 0;

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                    onClick={() => setMode('library')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'library'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Problem Library
                </button>
                <button
                    onClick={() => setMode('custom')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'custom'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Custom Question
                </button>
            </div>

            {/* Library Mode */}
            {mode === 'library' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select a Problem
                    </label>
                    {loadingProblems ? (
                        <div className="text-sm text-gray-500">Loading problems...</div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedProblemId}
                                onChange={(e) => setSelectedProblemId(e.target.value)}
                                className="w-full appearance-none p-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Choose a problem...</option>
                                {problems.map((problem) => (
                                    <option key={problem.id} value={problem.id}>
                                        {problem.title} ({problem.difficulty})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    {selectedProblemId && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-start gap-3 mb-2">
                                <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    {problems.find(p => p.id === selectedProblemId)?.difficulty?.toUpperCase()}
                                </div>
                                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {problems.find(p => p.id === selectedProblemId)?.category?.toUpperCase()}
                                </div>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                {problems.find(p => p.id === selectedProblemId)?.problem_text}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Mode */}
            {mode === 'custom' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enter Your Question
                    </label>
                    <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Type your reasoning problem here..."
                        rows={4}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {customQuestion.length} characters
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit || isLoading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Next: Choose Strategy
                    </>
                )}
            </button>
        </div>
    );
}

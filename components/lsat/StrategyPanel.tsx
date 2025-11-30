'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface StrategyPanelProps {
    questionType?: string;
    onClose: () => void;
}

interface StrategyData {
    content: string;
    similarity: number;
    metadata?: any;
}

export default function StrategyPanel({ questionType, onClose }: StrategyPanelProps) {
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState<StrategyData | null>(null);
    const [related, setRelated] = useState<Array<{ content: string; similarity: number }>>([]);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (questionType) {
            fetchStrategy(questionType);
        }
    }, [questionType]);

    const fetchStrategy = async (type: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/lsat/strategy?type=${encodeURIComponent(type)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch strategy');
            }

            if (data.found && data.strategy) {
                setStrategy(data.strategy);
                setRelated(data.related || []);
            } else {
                setError(data.message || 'No strategy found for this question type.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                        📚 Strategy: {questionType || 'LSAT Question'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white text-3xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="mt-4 text-gray-600">Loading strategy...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800">⚠️ {error}</p>
                        </div>
                    )}

                    {strategy && (
                        <div className="space-y-6">
                            {/* Match Score */}
                            <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700">
                                🎯 Relevance: {Math.round(strategy.similarity * 100)}% match
                            </div>

                            {/* Main Strategy Content - Rendered as Markdown */}
                            <div className="prose prose-sm max-w-none bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-indigo-700 mb-4" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-indigo-600 mt-6 mb-3" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-purple-600 mt-4 mb-2" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-3" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-3" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-gray-700 ml-2" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-700 my-2" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-purple-100 px-1 py-0.5 rounded text-sm" {...props} />,
                                    }}
                                >
                                    {strategy.content}
                                </ReactMarkdown>
                            </div>

                            {/* Related Strategies */}
                            {related.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-md font-bold text-gray-700 mb-3">
                                        📖 Related Strategies
                                    </h3>
                                    <div className="space-y-2">
                                        {related.map((r, i) => (
                                            <div key={i} className="bg-gray-50 rounded p-3">
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="text-gray-600 text-sm line-clamp-3" {...props} />,
                                                        }}
                                                    >
                                                        {r.content}
                                                    </ReactMarkdown>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {Math.round(r.similarity * 100)}% relevant
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

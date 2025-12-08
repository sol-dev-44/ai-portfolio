'use client';

// app/snapfix/components/DiagnosisResult.tsx
// Beautiful results display with structured diagnosis information

import { AlertTriangle, Clock, DollarSign, Wrench, Package, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { DiagnosisResponse } from '@/store/api/snapfixApi';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface DiagnosisResultProps {
    result: DiagnosisResponse;
}

const CATEGORY_COLORS: Record<string, string> = {
    plumbing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    electrical: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    automotive: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    appliance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    hvac: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    structural: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'text-green-600 dark:text-green-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    hard: 'text-orange-600 dark:text-orange-400',
    call_a_pro: 'text-red-600 dark:text-red-400'
};

export default function DiagnosisResult({ result }: DiagnosisResultProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `${result.diagnosis}\n\nCategory: ${result.category}\nDifficulty: ${result.difficulty}\nEstimated Time: ${result.estimated_time}\nEstimated Cost: ${result.estimated_cost}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${CATEGORY_COLORS[result.category] || CATEGORY_COLORS.general}`}>
                                {result.category.toUpperCase()}
                            </span>
                            <span className={`text-sm font-medium ${DIFFICULTY_COLORS[result.difficulty]}`}>
                                {result.difficulty.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {result.cause}
                        </h2>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        title="Copy diagnosis"
                    >
                        {copied ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{result.estimated_time}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{result.estimated_cost}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className={`w-3 h-3 rounded-full ${result.confidence === 'high' ? 'bg-green-500' : result.confidence === 'medium' ? 'bg-yellow-500' : 'bg-orange-500'}`} />
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
                            <p className="font-semibold text-gray-900 dark:text-white capitalize">{result.confidence}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Safety Warnings */}
            {result.warnings.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-red-900 dark:text-red-400 mb-2">Safety Warnings</h3>
                            <ul className="space-y-1">
                                {result.warnings.map((warning, i) => (
                                    <li key={i} className="text-red-800 dark:text-red-300 text-sm">
                                        • {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Diagnosis */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Diagnosis & Repair Guide
                </h3>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown>{result.diagnosis}</ReactMarkdown>
                </div>
            </div>

            {/* Tools & Parts */}
            <div className="grid md:grid-cols-2 gap-6">
                {result.tools_needed.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Wrench className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Tools Needed</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.tools_needed.map((tool, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {result.parts_needed.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Parts Needed</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.parts_needed.map((part, i) => (
                                <span key={i} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium">
                                    {part}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Resources */}
            {result.resources.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Related Resources</h4>
                    <div className="space-y-3">
                        {result.resources.map((resource, idx) => (
                            <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <div className="flex gap-4">
                                    {resource.thumbnail_url && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={resource.thumbnail_url}
                                                alt=""
                                                className="w-24 h-16 object-cover rounded-lg bg-gray-200 dark:bg-gray-700"
                                                onError={(e) => {
                                                    // Hide broken images
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors">
                                                {resource.title}
                                            </h4>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {resource.snippet}
                                        </p>
                                        {resource.source && (
                                            <span className="inline-block mt-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                {resource.source}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

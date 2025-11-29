'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRewriteClauseMutation } from '../../store/api/contractApi';

interface Risk {
    type: string;
    severity: number;
    location: string;
    explanation: string;
    suggested_fix: string;
    rewrite_suggestion?: string;
}

interface RiskCardProps {
    risk: Risk;
    isSelected: boolean;
    onClick: () => void;
}

const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'red';
    if (severity >= 6) return 'orange';
    if (severity >= 4) return 'yellow';
    return 'blue';
};

const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Critical';
    if (severity >= 6) return 'High';
    if (severity >= 4) return 'Medium';
    return 'Low';
};

export default function RiskCard({ risk, isSelected, onClick }: RiskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [rewriteClause, { isLoading: isRewriting }] = useRewriteClauseMutation();
    const [rewrittenText, setRewrittenText] = useState<string | null>(risk.rewrite_suggestion || null);

    const color = getSeverityColor(risk.severity);
    const label = getSeverityLabel(risk.severity);

    const colorClasses = {
        red: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-700 dark:text-red-400',
            badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
            hover: 'hover:border-red-300 dark:hover:border-red-700 hover:bg-red-100/50 dark:hover:bg-red-900/30'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
            text: 'text-orange-700 dark:text-orange-400',
            badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
            hover: 'hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-100/50 dark:hover:bg-orange-900/30'
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-700 dark:text-yellow-400',
            badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
            hover: 'hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-700 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
            hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
        }
    };

    const classes = colorClasses[color];

    const handleRewrite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (rewrittenText) return; // Already have rewrite

        try {
            const result = await rewriteClause({
                clause_text: risk.location,
                risk_type: risk.type,
                context: risk.explanation
            }).unwrap();
            setRewrittenText(result.rewritten_text);
        } catch (error) {
            console.error('Rewrite failed:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`${classes.bg} ${classes.border} ${classes.hover} border-2 rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
        >
            {/* Header - Always Visible, Clickable */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="p-4 cursor-pointer transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <AlertTriangle className={`w-5 h-5 ${classes.text} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {risk.type.replace(/_/g, ' ')}
                                </h4>
                                <span className={`${classes.badge} px-2 py-0.5 rounded-full text-xs font-bold`}>
                                    {label} ({risk.severity}/10)
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {risk.location}
                            </p>
                            {!isExpanded && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1 font-medium">
                                    <ChevronDown className="w-3 h-3 animate-bounce" />
                                    Click to expand and see suggested rewrite
                                </p>
                            )}
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`${classes.text} flex-shrink-0`}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                            {/* Explanation */}
                            <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Why This Is Risky
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {risk.explanation}
                                </p>
                            </div>

                            {/* Suggested Fix */}
                            <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Recommended Action
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {risk.suggested_fix}
                                </p>
                            </div>

                            {/* Rewrite Button */}
                            <button
                                onClick={handleRewrite}
                                disabled={isRewriting || !!rewrittenText}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-4 h-4" />
                                {isRewriting ? 'Generating...' : rewrittenText ? 'Rewrite Generated ✓' : 'Get AI-Suggested Rewrite'}
                            </button>

                            {/* Rewrite Suggestion (if available) */}
                            {rewrittenText && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
                                >
                                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        AI-Suggested Rewrite
                                    </h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                        "{rewrittenText}"
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

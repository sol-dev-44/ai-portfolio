'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ToolExecutionCardProps {
    toolName: string;
    args: Record<string, any>;
    result?: string;
    isExecuting?: boolean;
    error?: string;
}

export default function ToolExecutionCard({
    toolName,
    args,
    result,
    isExecuting = false,
    error
}: ToolExecutionCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${isExecuting ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            error ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        <Terminal size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            Used tool: <span className="font-mono text-blue-600 dark:text-blue-400">{toolName}</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isExecuting ? 'Executing...' : error ? 'Failed' : 'Completed'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isExecuting && <Loader2 size={16} className="animate-spin text-blue-500" />}
                    {!isExecuting && !error && <CheckCircle2 size={16} className="text-green-500" />}
                    {error && <AlertCircle size={16} className="text-red-500" />}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="p-4 space-y-3">
                            {/* Arguments */}
                            <div>
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    Input Arguments
                                </div>
                                <div className="bg-white dark:bg-gray-950 rounded p-2 border border-gray-200 dark:border-gray-800 font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                                    {JSON.stringify(args, null, 2)}
                                </div>
                            </div>

                            {/* Result */}
                            {(result || error) && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                        {error ? 'Error Output' : 'Result Output'}
                                    </div>
                                    <div className={`rounded p-2 border font-mono text-xs overflow-x-auto whitespace-pre-wrap ${error
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300'
                                            : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                                        }`}>
                                        {error || result}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

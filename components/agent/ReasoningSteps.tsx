'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface ReasoningStepsProps {
    steps: string[];
    isThinking?: boolean;
}

export default function ReasoningSteps({ steps, isThinking = false }: ReasoningStepsProps) {
    if (steps.length === 0 && !isThinking) return null;

    return (
        <div className="my-2 pl-4 border-l-2 border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                <BrainCircuit size={14} />
                <span>Reasoning Process</span>
            </div>

            <div className="space-y-2">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-gray-600 dark:text-gray-400 italic"
                    >
                        "{step}"
                    </motion.div>
                ))}

                {isThinking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500 italic"
                    >
                        <span>Thinking</span>
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-75">.</span>
                        <span className="animate-pulse delay-150">.</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

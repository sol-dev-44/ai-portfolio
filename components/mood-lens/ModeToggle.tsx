
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Image, Images } from 'lucide-react';

interface ModeToggleProps {
    mode: 'single' | 'compare';
    onChange: (mode: 'single' | 'compare') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
    return (
        <div className="flex items-center justify-center gap-2 p-1 bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl w-fit mx-auto">
            <button
                onClick={() => onChange('single')}
                className="relative px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
                {mode === 'single' && (
                    <motion.div
                        layoutId="mode-indicator"
                        className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/30 rounded-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Image className={`w-4 h-4 relative z-10 ${mode === 'single' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-500'}`} />
                <span className={`text-sm font-medium relative z-10 ${mode === 'single' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Single
                </span>
            </button>

            <button
                onClick={() => onChange('compare')}
                className="relative px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
                {mode === 'compare' && (
                    <motion.div
                        layoutId="mode-indicator"
                        className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/30 rounded-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Images className={`w-4 h-4 relative z-10 ${mode === 'compare' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-500'}`} />
                <span className={`text-sm font-medium relative z-10 ${mode === 'compare' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Compare
                </span>
            </button>
        </div>
    );
}

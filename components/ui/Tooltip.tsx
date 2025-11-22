'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
}

export default function Tooltip({
    content,
    children,
    position = 'top',
    delay = 0.2,
    className = ''
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionStyles = {
        top: { bottom: '100%', left: '50%', x: '-50%', y: -8, marginBottom: 4 },
        bottom: { top: '100%', left: '50%', x: '-50%', y: 8, marginTop: 4 },
        left: { right: '100%', top: '50%', y: '-50%', x: -8, marginRight: 4 },
        right: { left: '100%', top: '50%', y: '-50%', x: 8, marginLeft: 4 },
    };

    const currentStyle = positionStyles[position];

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, ...currentStyle }}
                        animate={{ opacity: 1, scale: 1, x: currentStyle.x, y: currentStyle.y }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay }}
                        style={{
                            position: 'absolute',
                            ...((position === 'top' || position === 'bottom') ? { left: '50%' } : { top: '50%' }),
                            ...(position === 'top' ? { bottom: '100%', marginBottom: 8 } : {}),
                            ...(position === 'bottom' ? { top: '100%', marginTop: 8 } : {}),
                            ...(position === 'left' ? { right: '100%', marginRight: 8 } : {}),
                            ...(position === 'right' ? { left: '100%', marginLeft: 8 } : {}),
                        }}
                        className="z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl whitespace-normal max-w-sm text-center pointer-events-none border border-gray-700 dark:border-gray-600"
                    >
                        {content}
                        {/* Arrow */}
                        <div
                            className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 border-r border-b border-gray-700 dark:border-gray-600"
                            style={{
                                ...(position === 'top' ? { bottom: -4, left: '50%', marginLeft: -4, borderTop: 'none', borderLeft: 'none' } : {}),
                                ...(position === 'bottom' ? { top: -4, left: '50%', marginLeft: -4, borderBottom: 'none', borderRight: 'none', transform: 'rotate(225deg)' } : {}),
                                ...(position === 'left' ? { right: -4, top: '50%', marginTop: -4, borderLeft: 'none', borderBottom: 'none', transform: 'rotate(-45deg)' } : {}),
                                ...(position === 'right' ? { left: -4, top: '50%', marginTop: -4, borderRight: 'none', borderTop: 'none', transform: 'rotate(135deg)' } : {}),
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

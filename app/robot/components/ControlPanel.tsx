'use client';

import { motion } from 'framer-motion';
import { Smile, Frown, Zap, Meh, Sparkles, Brain, Hand, Music, Footprints, User, Rocket } from 'lucide-react';

interface ControlPanelProps {
    action: string;
    expression: string;
    onActionChange: (action: string) => void;
    onExpressionChange: (expression: string) => void;
}

export default function ControlPanel({
    action,
    expression,
    onActionChange,
    onExpressionChange,
}: ControlPanelProps) {
    const actions = [
        { id: 'idle', label: 'Idle', icon: User, color: 'from-gray-400 to-gray-600' },
        { id: 'wave', label: 'Wave', icon: Hand, color: 'from-blue-400 to-blue-600' },
        { id: 'dance', label: 'Dance', icon: Music, color: 'from-purple-400 to-purple-600' },
        { id: 'walk', label: 'Walk', icon: Footprints, color: 'from-green-400 to-green-600' },
        { id: 'jump', label: 'Jump', icon: Rocket, color: 'from-orange-400 to-orange-600' },
    ];

    const expressions = [
        { id: 'neutral', label: 'Neutral', icon: Meh, color: 'from-gray-400 to-gray-600' },
        { id: 'happy', label: 'Happy', icon: Smile, color: 'from-yellow-400 to-yellow-600' },
        { id: 'sad', label: 'Sad', icon: Frown, color: 'from-blue-400 to-blue-600' },
        { id: 'surprised', label: 'Surprised', icon: Zap, color: 'from-pink-400 to-pink-600' },
        { id: 'excited', label: 'Excited', icon: Sparkles, color: 'from-red-400 to-red-600' },
        { id: 'thinking', label: 'Thinking', icon: Brain, color: 'from-indigo-400 to-indigo-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Actions Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl"
            >
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-600" />
                    Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {actions.map((act) => {
                        const Icon = act.icon;
                        const isActive = action === act.id;
                        return (
                            <motion.button
                                key={act.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onActionChange(act.id)}
                                className={`relative p-4 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-br ' + act.color + ' text-white shadow-lg ring-4 ring-offset-2 ring-blue-500/30'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Icon className={`w-6 h-6 ${isActive ? 'animate-bounce' : ''}`} />
                                    <span className="text-xs font-bold">{act.label}</span>
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeAction"
                                        className="absolute inset-0 rounded-xl border-2 border-white/50"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Expressions Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl"
            >
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Smile className="w-5 h-5 text-pink-600" />
                    Expressions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {expressions.map((expr) => {
                        const Icon = expr.icon;
                        const isActive = expression === expr.id;
                        return (
                            <motion.button
                                key={expr.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onExpressionChange(expr.id)}
                                className={`relative p-4 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-br ' + expr.color + ' text-white shadow-lg ring-4 ring-offset-2 ring-pink-500/30'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                                    <span className="text-xs font-bold">{expr.label}</span>
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeExpression"
                                        className="absolute inset-0 rounded-xl border-2 border-white/50"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}

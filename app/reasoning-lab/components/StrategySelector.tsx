'use client';

import { useState } from 'react';
import { Brain, Zap, Sparkles, Cpu } from 'lucide-react';

interface Strategy {
    id: 'zero_shot_cot' | 'self_consistency' | 'star';
    name: string;
    description: string;
    icon: React.ReactNode;
    estimatedTime: string;
    highlight?: boolean;
}

interface StrategySelectorProps {
    onSelect: (strategy: string, model: string) => void;
    disabled?: boolean;
}

export default function StrategySelector({ onSelect, disabled }: StrategySelectorProps) {
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');

    const strategies: Strategy[] = [
        {
            id: 'zero_shot_cot',
            name: 'Zero-Shot CoT',
            description: 'Single reasoning chain with step-by-step thinking',
            icon: <Brain className="w-6 h-6" />,
            estimatedTime: '~10 sec',
        },
        {
            id: 'self_consistency',
            name: 'Self-Consistency',
            description: 'Generate 5 chains and vote on the best answer',
            icon: <Zap className="w-6 h-6" />,
            estimatedTime: '~30 sec',
        },
        {
            id: 'star',
            name: 'STaR Simulation',
            description: '3-round simulation with golden trace selection',
            icon: <Sparkles className="w-6 h-6" />,
            estimatedTime: '~2-3 min',
        },
    ];

    const handleStrategyClick = (strategyId: string) => {
        const model = selectedModel || 'gpt-4o-mini'; // Default to mini if none selected
        onSelect(strategyId, model);
    };

    return (
        <div className="space-y-6">
            {/* Model Selection */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Cpu className="w-4 h-4" />
                    Select Reasoning Model
                </div>
                <button
                    onClick={() => setSelectedModel('gpt-4o-mini')}
                    disabled={disabled}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${selectedModel === 'gpt-4o-mini'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                >
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                        GPT-4o Mini (Recommended)
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Cost: ~$0.01 per run • Fast & accurate
                    </div>
                </button>

            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Choose a Reasoning Strategy
                </div>

                {strategies.map((strategy) => (
                    <button
                        key={strategy.id}
                        onClick={() => handleStrategyClick(strategy.id)}
                        disabled={disabled || !selectedModel}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${strategy.highlight
                            ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${strategy.highlight
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                {strategy.icon}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {strategy.name}
                                    </h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {strategy.estimatedTime}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {strategy.description}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

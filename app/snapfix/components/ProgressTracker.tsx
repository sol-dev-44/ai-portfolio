'use client';

// app/snapfix/components/ProgressTracker.tsx
// Real-time progress indicator for multi-agent diagnosis

import { CheckCircle, Loader2, Eye, Database, Globe, Calculator, Brain } from 'lucide-react';

interface ProgressStep {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const PROGRESS_STEPS: ProgressStep[] = [
    { id: 'vision', label: 'Analyzing Image', icon: Eye },
    { id: 'agents', label: 'Consulting Experts', icon: Database },
    { id: 'synthesis', label: 'Generating Report', icon: Brain }
];

interface ProgressTrackerProps {
    currentStage: string | null;
    completedStages: Set<string>;
}

export default function ProgressTracker({ currentStage, completedStages }: ProgressTrackerProps) {
    if (!currentStage && completedStages.size === 0) {
        return null;
    }

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Diagnosis Progress
            </h3>

            <div className="space-y-4">
                {PROGRESS_STEPS.map((step, index) => {
                    const isComplete = completedStages.has(step.id);
                    const isCurrent = currentStage === step.id;
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.id}
                            className={`
                flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 scale-105' : ''}
                ${isComplete ? 'opacity-80' : ''}
              `}
                        >
                            {/* Icon */}
                            <div
                                className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isComplete
                                        ? 'bg-green-500 text-white'
                                        : isCurrent
                                            ? 'bg-blue-500 text-white animate-pulse'
                                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                    }
                `}
                            >
                                {isComplete ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Icon className="w-6 h-6" />
                                )}
                            </div>

                            {/* Label */}
                            <div className="flex-1">
                                <p
                                    className={`
                    font-medium transition-colors
                    ${isCurrent ? 'text-blue-600 dark:text-blue-400' : ''}
                    ${isComplete ? 'text-green-600 dark:text-green-400' : ''}
                    ${!isCurrent && !isComplete ? 'text-gray-500 dark:text-gray-400' : ''}
                  `}
                                >
                                    {step.label}
                                </p>
                                {isCurrent && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        In progress...
                                    </p>
                                )}
                                {isComplete && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                        Complete
                                    </p>
                                )}
                            </div>

                            {/* Progress indicator line */}
                            {index < PROGRESS_STEPS.length - 1 && (
                                <div className="absolute left-10 top-20 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overall status */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        {completedStages.size} of {PROGRESS_STEPS.length} stages complete
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                            style={{ width: `${(completedStages.size / PROGRESS_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

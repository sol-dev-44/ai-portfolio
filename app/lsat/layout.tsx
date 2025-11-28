// app/lsat/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Scale, Brain, Zap, BookOpen } from 'lucide-react';

const TABS = [
    {
        href: '/lsat',
        label: 'Pattern Analyzer',
        icon: Brain,
        description: 'Deep analysis with RAG'
    },
    {
        href: '/lsat/quick',
        label: 'Quick Solve',
        icon: Zap,
        description: 'Instant answers'
    },
    // Future tabs:
    // { href: '/lsat/practice', label: 'Practice', icon: BookOpen },
];

export default function LSATLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Scale className="w-8 h-8 text-blue-500" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    LSAT Prep
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    AI-Powered Analysis
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 -mb-px">
                        {TABS.map((tab) => {
                            const isActive = pathname === tab.href ||
                                (tab.href !== '/lsat' && pathname?.startsWith(tab.href));
                            const Icon = tab.icon;

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 text-sm font-medium 
                                        border-b-2 transition-colors
                                        ${isActive
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
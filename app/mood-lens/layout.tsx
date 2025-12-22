
import React from 'react';

export default function MoodLensLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white selection:bg-purple-500/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-neutral-100/0 to-neutral-100/0 dark:from-purple-900/20 dark:via-neutral-900/0 dark:to-neutral-900/0 pointer-events-none" />
            <main className="relative z-10 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}

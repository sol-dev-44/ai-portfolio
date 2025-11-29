'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Risk {
    type: string;
    severity: number;
    location: string;
    explanation: string;
}

interface ContractViewerProps {
    text: string;
    risks: Risk[];
    selectedRiskIndex: number | null;
    onRiskClick: (index: number) => void;
}

export default function ContractViewer({ text, risks, selectedRiskIndex, onRiskClick }: ContractViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to highlight text
    const renderHighlightedText = () => {
        if (!text) return null;

        let lastIndex = 0;
        const elements: React.ReactNode[] = [];

        // Sort risks by position in text to avoid overlap issues (simple approach)
        // In a real app, we'd need more robust overlap handling
        const sortedRisks = [...risks].sort((a, b) => text.indexOf(a.location) - text.indexOf(b.location));

        sortedRisks.forEach((risk, index) => {
            const start = text.indexOf(risk.location, lastIndex);
            if (start === -1) return; // Risk text not found (or already passed)

            const end = start + risk.location.length;

            // Add text before risk
            if (start > lastIndex) {
                elements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, start)}</span>);
            }

            // Add highlighted risk
            const isSelected = selectedRiskIndex === index;
            const severityColor = risk.severity >= 8 ? 'bg-red-200 dark:bg-red-900/50' :
                risk.severity >= 5 ? 'bg-orange-200 dark:bg-orange-900/50' :
                    'bg-yellow-200 dark:bg-yellow-900/50';

            elements.push(
                <motion.span
                    key={`risk-${index}`}
                    onClick={() => onRiskClick(index)}
                    className={`cursor-pointer px-0.5 rounded transition-colors ${severityColor} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    whileHover={{ scale: 1.02 }}
                >
                    {text.substring(start, end)}
                </motion.span>
            );

            lastIndex = end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            elements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
        }

        return elements;
    };

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200"
        >
            {renderHighlightedText()}
        </div>
    );
}

'use client';

import { Shield, AlertTriangle } from 'lucide-react';
import RiskCard from './RiskCard';

interface Risk {
    type: string;
    severity: number;
    location: string;
    explanation: string;
    suggested_fix: string;
    rewrite_suggestion?: string;
}

interface Analysis {
    summary: string;
    overall_risk_score: number;
    risks: Risk[];
    missing_clauses: string[];
}

interface RiskPanelProps {
    analysis: Analysis;
    selectedRiskIndex: number | null;
    onRiskSelect: (index: number) => void;
}

export default function RiskPanel({ analysis, selectedRiskIndex, onRiskSelect }: RiskPanelProps) {
    const scoreColor = analysis.overall_risk_score > 70 ? 'text-red-500' :
        analysis.overall_risk_score > 40 ? 'text-orange-500' :
            'text-green-500';

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Risk Analysis
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Risk Score:</span>
                        <span className={`text-xl font-bold ${scoreColor}`}>
                            {analysis.overall_risk_score}/100
                        </span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysis.summary}
                </p>
            </div>

            {/* Risks List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Identified Risks ({analysis.risks.length})
                </h3>

                {analysis.risks.map((risk, index) => (
                    <RiskCard
                        key={index}
                        risk={risk}
                        isSelected={selectedRiskIndex === index}
                        onClick={() => onRiskSelect(index)}
                    />
                ))}

                {analysis.missing_clauses.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Missing Clauses
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <ul className="space-y-2">
                                {analysis.missing_clauses.map((clause, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                        <span>{clause}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

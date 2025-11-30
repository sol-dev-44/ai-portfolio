'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface ContractUploaderProps {
    onUpload: (text: string) => void;
    isAnalyzing: boolean;
}

export default function ContractUploader({ onUpload, isAnalyzing }: ContractUploaderProps) {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onUpload(text);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Paste Contract Text
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Copy and paste the full text of the contract you want to analyze below.
                </p>
            </div>

            <div className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste contract text here..."
                    className="w-full h-64 p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {text.length.toLocaleString()} characters
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!text.trim() || isAnalyzing}
                        className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing Contract...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Analyze Contract
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractUploaderProps {
    onUpload: (text: string) => void;
    isAnalyzing: boolean;
}

export default function ContractUploader({ onUpload, isAnalyzing }: ContractUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setText(content);
        };
        reader.readAsText(file);
    };

    const handleSubmit = () => {
        if (text.trim()) {
            onUpload(text);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept=".txt,.md,.json"
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {fileName ? fileName : 'Drop your contract here'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            or click to browse (TXT, MD, JSON)
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
                        Or paste text directly
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste contract text here..."
                    className="w-full h-64 p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || isAnalyzing}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    );
}

'use client';

import { useState, useCallback } from 'react';
import { FileText, Loader2, Upload, FileType, X } from 'lucide-react';

interface ContractUploaderProps {
    onUpload: (text: string) => void;
    isAnalyzing: boolean;
}

export default function ContractUploader({ onUpload, isAnalyzing }: ContractUploaderProps) {
    const [text, setText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        setError(null);
        setFileName(file.name);

        try {
            let extractedText = '';
            const fileType = file.name.split('.').pop()?.toLowerCase();

            if (['txt', 'md', 'json'].includes(fileType || '')) {
                extractedText = await file.text();
            } else {
                setError('Unsupported file type. Please upload .txt, .md, or .json files.');
                setFileName(null);
                return;
            }

            setText(extractedText);
        } catch (err) {
            setError('Error reading file. Please try again.');
            setFileName(null);
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            await processFile(file);
        }
    }, []);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    const handleSubmit = () => {
        if (text.trim()) {
            onUpload(text);
        }
    };

    const clearFile = () => {
        setText('');
        setFileName(null);
        setError(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div
                className={`
                    relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                    }
                    ${fileName ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isAnalyzing}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    {fileName ? (
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm z-20 relative">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileType className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {text.length.toLocaleString()} characters extracted
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    clearFile();
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    .txt, .md, or .json files supported
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Or paste contract text here..."
                        className="w-full h-64 p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none">
                        {text.length.toLocaleString()} characters
                    </div>
                </div>

                <div className="flex justify-end">
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
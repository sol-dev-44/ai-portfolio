'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractUploaderProps {
    onUpload: (text: string) => void;
    isAnalyzing: boolean;
}

export default function ContractUploader({ onUpload, isAnalyzing }: ContractUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const extractTextFromPDF = async (file: File): Promise<string> => {
        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Disable worker - runs on main thread (slightly slower but more reliable)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        }).promise;

        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    };

    const handleFile = async (file: File) => {
        setError(null);
        setFileName(file.name);

        const extension = file.name.split('.').pop()?.toLowerCase();

        // Handle PDF files
        if (extension === 'pdf') {
            setIsProcessing(true);
            try {
                const extractedText = await extractTextFromPDF(file);
                if (!extractedText.trim()) {
                    setError('Could not extract text from PDF. It may be scanned or image-based.');
                    setText('');
                } else {
                    setText(extractedText);
                }
            } catch (err) {
                console.error('PDF extraction error:', err);
                setError('Failed to read PDF. Please try a different file or paste text directly.');
                setText('');
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Handle text-based files (txt, md, json, doc/docx as text)
        if (['txt', 'md', 'json', 'text'].includes(extension || '')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setText(content);
            };
            reader.onerror = () => {
                setError('Failed to read file. Please try again.');
            };
            reader.readAsText(file);
            return;
        }

        // Unsupported format
        setError(`Unsupported file format: .${extension}. Please use PDF, TXT, or MD files.`);
    };

    const handleSubmit = () => {
        if (text.trim()) {
            onUpload(text);
        }
    };

    const clearFile = () => {
        setFileName(null);
        setText('');
        setError(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : error
                            ? 'border-red-300 dark:border-red-700'
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
                    accept=".pdf,.txt,.md,.json,.text"
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    {isProcessing ? (
                        <>
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    Processing PDF...
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Extracting text from {fileName}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`p-4 rounded-full ${error
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : fileName
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                {error ? (
                                    <FileWarning className="w-8 h-8 text-red-500" />
                                ) : fileName ? (
                                    <FileText className="w-8 h-8 text-green-500" />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                            <div>
                                {fileName ? (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {fileName}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                clearFile();
                                            }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                                        Drop your contract here
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {error ? (
                                        <span className="text-red-500">{error}</span>
                                    ) : (
                                        'Supports PDF, TXT, MD files'
                                    )}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* PDF Info Badge */}
            <AnimatePresence>
                {fileName?.endsWith('.pdf') && text && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                            Extracted {text.length.toLocaleString()} characters from PDF
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    onChange={(e) => {
                        setText(e.target.value);
                        setError(null);
                    }}
                    placeholder="Paste contract text here..."
                    className="w-full h-64 p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {text.length.toLocaleString()} characters
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!text.trim() || isAnalyzing || isProcessing}
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
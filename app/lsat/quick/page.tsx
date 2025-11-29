// app/lsat/quick/page.tsx
'use client';

import { useState, useCallback } from 'react';
import {
    Zap,
    Upload,
    ClipboardPaste,
    Loader2,
    CheckCircle2,
    Image as ImageIcon,
    X,
    AlertCircle
} from 'lucide-react';

export default function QuickSolvePage() {
    const [input, setInput] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;

        for (const item of items) {
            // Handle pasted image
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setImage(e.target?.result as string);
                        setInput(''); // Clear text if image pasted
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }
        }
        // Text paste is handled normally by textarea
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
                setInput('');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
                setInput('');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const clearImage = () => {
        setImage(null);
    };

    const solve = async () => {
        if (!input.trim() && !image) return;

        setLoading(true);
        setAnswer(null);
        setError(null);

        try {
            const res = await fetch('/api/lsat/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: input.trim() || undefined,
                    image: image || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to solve');
            }

            setAnswer(data.answer);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setInput('');
        setImage(null);
        setAnswer(null);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium mb-4">
                    <Zap className="w-4 h-4" />
                    Quick Solve
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Get the Answer. Fast.
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Paste question text or drop a screenshot. No explanation, just the answer.
                </p>
            </div>

            {/* Input Area */}
            <div
                className={`
                    relative bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed 
                    transition-colors mb-6
                    ${image ? 'border-green-300 dark:border-green-700' : 'border-gray-300 dark:border-gray-600'}
                `}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                {image ? (
                    // Image Preview
                    <div className="p-4">
                        <div className="relative">
                            <img
                                src={image}
                                alt="Question"
                                className="max-h-96 mx-auto rounded-lg"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Image ready. Click Solve to get the answer.
                        </p>
                    </div>
                ) : (
                    // Text Input + Drop Zone
                    <div className="p-4">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Paste question here (text or image)...

Example:
The scientist argued that because the vaccine was developed quickly, it must be unsafe. Which of the following identifies a flaw in the scientist's reasoning?

A) It assumes without justification that speed implies danger
B) It relies on an unrepresentative sample
C) It confuses correlation with causation
D) It appeals to authority
E) It contains circular reasoning"
                            className="w-full h-48 p-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none"
                        />

                        {/* Drop zone hint */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <ClipboardPaste className="w-4 h-4" />
                                <span>Paste</span>
                            </div>
                            <div className="text-gray-300 dark:text-gray-600">|</div>
                            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                <Upload className="w-4 h-4" />
                                <span>Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                            <div className="text-gray-300 dark:text-gray-600">|</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <ImageIcon className="w-4 h-4" />
                                <span>Drop image</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
                <button
                    onClick={solve}
                    disabled={loading || (!input.trim() && !image)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Solving...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            Solve
                        </>
                    )}
                </button>
                <button
                    onClick={clear}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Clear
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Answer Display */}
            {answer && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {answer}
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                        Correct Answer
                    </p>
                </div>
            )}

            {/* Tips */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>💡 For best results with screenshots, ensure the question and all answer choices are visible.</p>
            </div>
        </div>
    );
}

'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // Assuming react-dropzone is available or I'll standard input
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
    onImageSelected: (file: File, base64: string) => void;
    selectedImage: string | null;
    onClear: () => void;
    isLoading?: boolean;
}

export function ImageUploader({ onImageSelected, selectedImage, onClear, isLoading }: ImageUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onImageSelected(file, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelected]);

    // If react-dropzone is not available, I'll use a hidden input fallback logic if needed
    // For now I'll assume standard HTML input logic wrapped in a clear UI

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onImageSelected(file, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
                {!selectedImage ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-12 text-center hover:border-purple-500/50 transition-colors bg-white/50 dark:bg-neutral-800/20 backdrop-blur-sm group cursor-pointer relative overflow-hidden"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-none">
                            <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-purple-500/10 transition-colors">
                                <Upload className="w-8 h-8 text-neutral-500 dark:text-neutral-400 group-hover:text-purple-500 dark:group-hover:text-purple-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">
                                    Upload an image to analyze
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Drag & drop or click to select
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10 dark:shadow-purple-900/20 group border border-neutral-200 dark:border-neutral-800"
                    >
                        <img
                            src={selectedImage}
                            alt="Selected"
                            className="w-full h-auto max-h-[60vh] object-contain bg-neutral-100 dark:bg-black/50"
                        />

                        {!isLoading && (
                            <button
                                onClick={onClear}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors backdrop-blur-md"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-purple-700 dark:text-purple-200 font-medium animate-pulse">Analyzing vibes...</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

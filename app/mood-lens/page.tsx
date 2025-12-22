
'use client';

import React, { useState } from 'react';
import { ImageUploader } from '@/components/mood-lens/ImageUploader';
import { useAnalyzeImageMutation, MoodLensAnalysisResponse } from '@/store/api/moodLensApi';
import { motion } from 'framer-motion';

import { QuantitativeViz } from '@/components/mood-lens/QuantitativeViz';
import { GenerativeViz } from '@/components/mood-lens/GenerativeViz';
import { EmotionBreakdown } from '@/components/mood-lens/EmotionBreakdown';
import { TechBreakdown } from '@/components/mood-lens/TechBreakdown';
import { ModeToggle } from '@/components/mood-lens/ModeToggle';
import { ComparisonView } from '@/components/mood-lens/ComparisonView';
import { ColorHarmonyWheel } from '@/components/mood-lens/ColorHarmonyWheel';
import { SentimentFlow } from '@/components/mood-lens/SentimentFlow';

type Mode = 'single' | 'compare';

export default function MoodLensPage() {
    const [mode, setMode] = useState<Mode>('single');

    // Single mode state
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analyzeImage, { data: analysis, isLoading, error }] = useAnalyzeImageMutation();

    // Compare mode state
    const [selectedImageA, setSelectedImageA] = useState<string | null>(null);
    const [selectedImageB, setSelectedImageB] = useState<string | null>(null);
    const [analyzeImageA, { data: analysisA, isLoading: isLoadingA, error: errorA }] = useAnalyzeImageMutation();
    const [analyzeImageB, { data: analysisB, isLoading: isLoadingB, error: errorB }] = useAnalyzeImageMutation();

    const handleImageSelected = async (file: File, base64: string) => {
        setSelectedImage(base64);
        try {
            console.log('Sending image to API...', { fileName: file.name, fileType: file.type, size: file.size });
            const result = await analyzeImage({ imageBlob: base64 }).unwrap();
            console.log('Analysis successful:', result);
        } catch (err: any) {
            console.error('Analysis failed:', err);
            console.error('Error details:', {
                status: err?.status,
                data: err?.data,
                message: err?.message,
                fullError: JSON.stringify(err, null, 2)
            });
            // Extract error message properly
            let errorMsg = 'Unknown error';
            if (err?.data?.error) {
                errorMsg = typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
            } else if (err?.message) {
                errorMsg = err.message;
            } else if (err?.data) {
                errorMsg = JSON.stringify(err.data);
            }
            alert(`Analysis failed: ${errorMsg}\n\nCheck Safari console (Develop > Show JavaScript Console) for full details.`);
        }
    };

    const handleImageASelected = async (file: File, base64: string) => {
        setSelectedImageA(base64);
        try {
            console.log('Sending image A to API...', { fileName: file.name, fileType: file.type, size: file.size });
            await analyzeImageA({ imageBlob: base64 }).unwrap();
        } catch (err: any) {
            console.error('Analysis A failed:', err);
            let errorMsg = 'Unknown error';
            if (err?.data?.error) {
                errorMsg = typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
            } else if (err?.message) {
                errorMsg = err.message;
            }
            alert(`Analysis failed: ${errorMsg}`);
        }
    };

    const handleImageBSelected = async (file: File, base64: string) => {
        setSelectedImageB(base64);
        try {
            console.log('Sending image B to API...', { fileName: file.name, fileType: file.type, size: file.size });
            await analyzeImageB({ imageBlob: base64 }).unwrap();
        } catch (err: any) {
            console.error('Analysis B failed:', err);
            let errorMsg = 'Unknown error';
            if (err?.data?.error) {
                errorMsg = typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
            } else if (err?.message) {
                errorMsg = err.message;
            }
            alert(`Analysis failed: ${errorMsg}`);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
    };

    const clearImageA = () => {
        setSelectedImageA(null);
    };

    const clearImageB = () => {
        setSelectedImageB(null);
    };

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        // Only clear the opposite mode's state to preserve current mode data
        if (newMode === 'single') {
            // Switching to single mode - clear compare mode state
            setSelectedImageA(null);
            setSelectedImageB(null);
        } else {
            // Switching to compare mode - clear single mode state
            setSelectedImage(null);
        }
    };

    return (
        <div className="space-y-12">
            <div className="text-center space-y-8">
                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400"
                    >
                        MoodLens
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto"
                    >
                        Upload {mode === 'compare' ? 'two images' : 'an image'} to reveal {mode === 'compare' ? 'their' : 'its'} hidden emotional landscape through AI vision and generative art.
                    </motion.p>
                </div>

                <ModeToggle mode={mode} onChange={handleModeChange} />
                <TechBreakdown />
            </div>

            {mode === 'single' ? (
                <>
                    <ImageUploader
                        onImageSelected={handleImageSelected}
                        selectedImage={selectedImage}
                        onClear={clearImage}
                        isLoading={isLoading}
                    />

                    {error ? (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-center max-w-xl mx-auto">
                            Something went wrong analyzing the image. Please try again.
                        </div>
                    ) : null}

                    {analysis && !isLoading && selectedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Analysis Text & Sentiment */}
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Visual Analysis</h2>
                                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed bg-white/50 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        {analysis.description}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Detected Moods</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.moodKeywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-purple-700 dark:text-purple-200 text-sm font-medium"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Extracted Palette</h2>
                                    <div className="flex gap-2 p-4 bg-white/50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        {analysis.colorPalette.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-12 h-12 rounded-lg shadow-lg ring-1 ring-white/10"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Visualization Section */}
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Emotional Signature</h2>
                                    {analysis.sentiment && (
                                        <GenerativeViz
                                            sentiment={analysis.sentiment}
                                            palette={analysis.colorPalette}
                                            style={analysis.style}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Analysis Metrics</h3>
                                        {analysis.sentiment && (
                                            <QuantitativeViz sentiment={analysis.sentiment} />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Color Harmony</h3>
                                        <ColorHarmonyWheel palette={analysis.colorPalette} />
                                    </div>
                                    {analysis.sentiment && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sentiment Flow</h3>
                                            <SentimentFlow sentiment={analysis.sentiment} palette={analysis.colorPalette} />
                                        </div>
                                    )}
                                    {analysis.emotions && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Emotion Spectrum</h3>
                                            <EmotionBreakdown emotions={analysis.emotions} />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-center gap-4">
                                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Dominant Palette</h3>
                                            <div className="grid grid-cols-5 gap-2 h-20">
                                                {analysis.colorPalette.map((color, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="h-full rounded-md shadow-lg ring-1 ring-black/5 dark:ring-white/10 cursor-pointer hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => navigator.clipboard.writeText(color)}
                                                        title={`Copy ${color}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-neutral-500 text-center">Click to copy hex codes</p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </>
            ) : (
                <>
                    {/* Compare Mode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">A</span>
                                </div>
                                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Image A</h3>
                            </div>
                            <ImageUploader
                                onImageSelected={handleImageASelected}
                                selectedImage={selectedImageA}
                                onClear={clearImageA}
                                isLoading={isLoadingA}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-pink-500/20 dark:bg-pink-500/30 flex items-center justify-center">
                                    <span className="text-xs font-bold text-pink-700 dark:text-pink-400">B</span>
                                </div>
                                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Image B</h3>
                            </div>
                            <ImageUploader
                                onImageSelected={handleImageBSelected}
                                selectedImage={selectedImageB}
                                onClear={clearImageB}
                                isLoading={isLoadingB}
                            />
                        </div>
                    </div>

                    {(errorA || errorB) && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-center max-w-xl mx-auto">
                            Something went wrong analyzing the image{errorA && errorB ? 's' : ''}. Please try again.
                        </div>
                    )}

                    {analysisA && analysisB && !isLoadingA && !isLoadingB && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <ComparisonView analysisA={analysisA} analysisB={analysisB} />
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}

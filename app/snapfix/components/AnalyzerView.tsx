'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wrench, RefreshCw, ArrowRight } from 'lucide-react';
import ImageUpload from './ImageUpload';
import ProgressTracker from './ProgressTracker';
import DiagnosisResult from './DiagnosisResult';
import { useSnapFixDiagnosis, DiagnosisResponse } from '@/store/api/snapfixApi';

export default function AnalyzerView() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [currentStage, setCurrentStage] = useState<string | null>(null);
    const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
    const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
    const [streamingText, setStreamingText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { diagnose } = useSnapFixDiagnosis();

    const handleDiagnose = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setError(null);
        setDiagnosisResult(null);
        setStreamingText('');
        setCurrentStage(null);
        setCompletedStages(new Set());

        await diagnose(selectedImage, userPrompt || null, {
            onProgress: (stage, status) => {
                setCurrentStage(stage);
                if (status === 'complete') {
                    setCompletedStages(prev => new Set([...prev, stage]));
                }
            },
            onVisionResult: (analysis) => {
                console.log('Vision analysis:', analysis);
            },
            onText: (content) => {
                setStreamingText(prev => prev + content);
            },
            onComplete: (diagnosis, metadata) => {
                setDiagnosisResult(diagnosis);
                setIsAnalyzing(false);
                setCurrentStage(null);
                setStreamingText('');
                console.log('Diagnosis complete:', metadata);
            },
            onError: (error) => {
                setError(error);
                setIsAnalyzing(false);
                setCurrentStage(null);
                setStreamingText('');
            }
        });
    };

    const handleStartOver = () => {
        setSelectedImage(null);
        setUserPrompt('');
        setDiagnosisResult(null);
        setStreamingText('');
        setError(null);
        setCurrentStage(null);
        setCompletedStages(new Set());
    };

    return (
        <div className="space-y-8">
            {/* New CTA for diagnosing another problem (Visible only when result is shown) */}
            <AnimatePresence>
                {diagnosisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex justify-center mb-8"
                    >
                        <button
                            onClick={handleStartOver}
                            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Diagnose Another Problem
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all duration-300" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 text-red-700 dark:text-red-400"
                    >
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">Analysis Failed</h3>
                            <p className="text-sm opacity-90">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-xs font-medium underline mt-2 hover:opacity-80"
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!diagnosisResult ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Image Upload */}
                        <ImageUpload
                            onImageSelect={setSelectedImage}
                            selectedImage={selectedImage}
                            onClear={() => setSelectedImage(null)}
                        />

                        {/* Optional Text Prompt */}
                        {selectedImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Describe the problem (optional)
                                    </label>
                                    <textarea
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                        placeholder="E.g., The pipe started leaking after I tightened the nut..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-32"
                                    />
                                </div>

                                <button
                                    onClick={handleDiagnose}
                                    disabled={isAnalyzing}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-0.5
                                        ${isAnalyzing
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Wrench className="w-5 h-5" />
                                            Start Diagnosis
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* Progress Tracker */}
                        {isAnalyzing && (
                            <>
                                <ProgressTracker
                                    currentStage={currentStage}
                                    completedStages={completedStages}
                                />

                                {/* Streaming Text Display */}
                                {streamingText && (
                                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                Generating Diagnosis...
                                            </span>
                                        </div>
                                        <div className="prose prose-gray dark:prose-invert max-w-none opacity-80">
                                            <div className="whitespace-pre-wrap">{streamingText}</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <DiagnosisResult result={diagnosisResult} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

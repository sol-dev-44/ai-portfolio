'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { RootState } from '../../store/store';
import {
    setContractText,
    setAnalysis,
    setIsAnalyzing,
    setSelectedRiskIndex,
    resetContract
} from '../../store/contractSlice';
import { useAnalyzeContractMutation, useGetContractStatsQuery } from '../../store/api/contractApi';

import ContractUploader from '../../components/contract/ContractUploader';
import ContractViewer from '../../components/contract/ContractViewer';
import RiskPanel from '../../components/contract/RiskPanel';
import RAGStats from '../../components/contract/RAGStats';

export default function ContractAuditorPage() {
    const dispatch = useDispatch();
    const { contractText, analysis, isAnalyzing, selectedRiskIndex } = useSelector((state: RootState) => state.contract);
    const [analyzeContract] = useAnalyzeContractMutation();
    const { data: stats } = useGetContractStatsQuery();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(resetContract());
        };
    }, [dispatch]);

    const handleUpload = async (text: string) => {
        dispatch(setContractText(text));
        dispatch(setIsAnalyzing(true));

        try {
            const result = await analyzeContract({
                text,
                use_cache: true,
                use_rag: true
            }).unwrap();

            dispatch(setAnalysis(result.analysis));
        } catch (error) {
            console.error('Analysis failed:', error);
            // Handle error state here
        } finally {
            dispatch(setIsAnalyzing(false));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Contract Auditor</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Risk Analysis & Mitigation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <RAGStats stats={stats || null} />
                <AnimatePresence mode="wait">
                    {!analysis ? (
                        <motion.div
                            key="uploader"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center min-h-[60vh]"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    Upload Your Contract
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                                    Get instant risk analysis, severity scoring, and AI-suggested rewrites for your legal documents.
                                </p>
                            </div>
                            <ContractUploader onUpload={handleUpload} isAnalyzing={isAnalyzing} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="analysis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]"
                        >
                            {/* Left: Contract Viewer */}
                            <div className="h-full flex flex-col">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Contract Text</h3>
                                    <button
                                        onClick={() => dispatch(resetContract())}
                                        className="text-sm text-blue-500 hover:text-blue-600"
                                    >
                                        Upload New
                                    </button>
                                </div>
                                <ContractViewer
                                    text={contractText || ''}
                                    risks={analysis.risks}
                                    selectedRiskIndex={selectedRiskIndex}
                                    onRiskClick={(index) => dispatch(setSelectedRiskIndex(index))}
                                />
                            </div>

                            {/* Right: Risk Panel */}
                            <div className="h-full">
                                <RiskPanel
                                    analysis={analysis}
                                    selectedRiskIndex={selectedRiskIndex}
                                    onRiskSelect={(index) => dispatch(setSelectedRiskIndex(index))}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dog, Sparkles, Search, GitCompare, MessageCircle, ChevronRight } from 'lucide-react';
import QuizFeature from './Quiz';
import BreedExplorer from './BreedExplorer';
import BreedComparison from './BreedComparison';
import BreedChat from './BreedChat';

type Feature = 'home' | 'quiz' | 'explore' | 'compare' | 'chat';

const features = [
    {
        id: 'quiz' as Feature,
        name: 'Find My Match',
        shortName: 'Match',
        icon: Sparkles,
        description: 'Take a personalized quiz to find your perfect breed match using AI-powered semantic search',
        gradient: 'from-indigo-500 to-purple-600',
        bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        emoji: '🎯'
    },
    {
        id: 'explore' as Feature,
        name: 'Explore Breeds',
        shortName: 'Explore',
        icon: Search,
        description: 'Browse, search, and filter through 300+ dog breeds with detailed information',
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        emoji: '🔍'
    },
    {
        id: 'compare' as Feature,
        name: 'Compare Breeds',
        shortName: 'Compare',
        icon: GitCompare,
        description: 'Select up to 4 breeds for detailed side-by-side comparison with radar charts',
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        emoji: '⚖️'
    },
    {
        id: 'chat' as Feature,
        name: 'Chat with a Breed',
        shortName: 'Chat',
        icon: MessageCircle,
        description: 'Have a conversation with any breed - experience their unique personality through AI',
        gradient: 'from-pink-500 to-rose-600',
        bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
        borderColor: 'border-pink-200 dark:border-pink-800',
        emoji: '💬'
    }
];

export default function DogMatcherPage() {
    const [activeFeature, setActiveFeature] = useState<Feature>('home');
    const [selectedBreedsForCompare, setSelectedBreedsForCompare] = useState<string[]>([]);
    const [selectedBreedForChat, setSelectedBreedForChat] = useState<string | null>(null);

    const handleCompareBreed = (breedId: string) => {
        setSelectedBreedsForCompare(prev => {
            if (prev.includes(breedId)) {
                return prev.filter(id => id !== breedId);
            }
            if (prev.length >= 4) {
                return prev;
            }
            return [...prev, breedId];
        });
    };

    const handleRemoveBreedFromCompare = (breedId: string) => {
        setSelectedBreedsForCompare(prev => prev.filter(id => id !== breedId));
    };

    const handleStartChatWithBreed = (breedId: string) => {
        setSelectedBreedForChat(breedId);
        setActiveFeature('chat');
    };

    const handleGoToCompare = () => {
        setActiveFeature('compare');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <button
                            onClick={() => setActiveFeature('home')}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Dog className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                                Dog Breed Matcher
                            </span>
                        </button>

                        {/* Feature Tabs */}
                        <div className="flex items-center gap-1">
                            {features.map((feature) => {
                                const Icon = feature.icon;
                                const isActive = activeFeature === feature.id;

                                return (
                                    <button
                                        key={feature.id}
                                        onClick={() => setActiveFeature(feature.id)}
                                        className={`relative px-2 sm:px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm ${isActive
                                            ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg`
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden md:inline">{feature.shortName}</span>

                                        {/* Badge for compare count */}
                                        {feature.id === 'compare' && selectedBreedsForCompare.length > 0 && (
                                            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive
                                                ? 'bg-white/30 text-white'
                                                : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {selectedBreedsForCompare.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="py-8">
                <AnimatePresence mode="wait">
                    {/* Home / Feature Selection */}
                    {activeFeature === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-6xl mx-auto px-4"
                        >
                            {/* Hero Section */}
                            <div className="text-center mb-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-2xl"
                                >
                                    <Dog className="w-12 h-12 text-white" />
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                                >
                                    Dog Breed Matcher
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                                >
                                    Discover your perfect canine companion using AI-powered matching,
                                    explore 300+ breeds, compare side-by-side, or chat with any breed!
                                </motion.p>
                            </div>

                            {/* Feature Cards */}
                            <div className="grid md:grid-cols-2 gap-6 mb-12">
                                {features.map((feature, index) => {
                                    const Icon = feature.icon;

                                    return (
                                        <motion.button
                                            key={feature.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + index * 0.1 }}
                                            onClick={() => setActiveFeature(feature.id)}
                                            className={`group relative p-6 bg-gradient-to-br ${feature.bgGradient} rounded-2xl border-2 ${feature.borderColor} text-left hover:shadow-xl transition-all hover:scale-[1.02]`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-2xl">{feature.emoji}</span>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {feature.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                                            </div>

                                            {/* Badge for compare */}
                                            {feature.id === 'compare' && selectedBreedsForCompare.length > 0 && (
                                                <div className="absolute top-4 right-4 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                                    {selectedBreedsForCompare.length} selected
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Tech Stack Preview */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center"
                            >
                                <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                                    Powered by
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['OpenAI Embeddings', 'Supabase pgvector', 'Claude AI', 'Next.js 14', 'FastAPI'].map((tech) => (
                                        <span
                                            key={tech}
                                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Quiz Feature */}
                    {activeFeature === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <QuizFeature
                                onStartChat={handleStartChatWithBreed}
                                onAddToCompare={handleCompareBreed}
                                selectedForCompare={selectedBreedsForCompare}
                            />
                        </motion.div>
                    )}

                    {/* Explore Feature */}
                    {activeFeature === 'explore' && (
                        <motion.div
                            key="explore"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <BreedExplorer
                                onCompare={handleCompareBreed}
                                selectedBreeds={selectedBreedsForCompare}
                                onStartChat={handleStartChatWithBreed}
                                onGoToCompare={handleGoToCompare}
                            />
                        </motion.div>
                    )}

                    {/* Compare Feature */}
                    {activeFeature === 'compare' && (
                        <motion.div
                            key="compare"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <BreedComparison
                                selectedBreedIds={selectedBreedsForCompare}
                                onRemoveBreed={handleRemoveBreedFromCompare}
                                onStartChat={handleStartChatWithBreed}
                                onExploreMore={() => setActiveFeature('explore')}
                            />
                        </motion.div>
                    )}

                    {/* Chat Feature */}
                    {activeFeature === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <BreedChat
                                initialBreedId={selectedBreedForChat}
                                onClearBreed={() => setSelectedBreedForChat(null)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
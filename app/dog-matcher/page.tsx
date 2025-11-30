'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dog, Sparkles, Search, GitCompare, MessageCircle, ChevronRight, Code2, X, Database, Brain, Cpu, Zap } from 'lucide-react';

// Import feature components
import QuizFeature from './components/QuizFeature';
import BreedExplorer from './components/BreedExplorer';
import BreedComparison from './components/BreedComparison';
import BreedChat from './components/BreedChat';

type Feature = 'home' | 'quiz' | 'explore' | 'compare' | 'chat';

// App branding
const APP_NAME = "Pawfect Match";
const APP_TAGLINE = "AI-Powered Dog Breed Discovery";

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
    const [showTechGuide, setShowTechGuide] = useState(false);

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
                            <div className="hidden sm:block">
                                <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {APP_NAME}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                                    {APP_TAGLINE}
                                </span>
                            </div>
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

                            {/* Tech Guide Button */}
                            <button
                                onClick={() => setShowTechGuide(true)}
                                className="ml-2 px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                title="How It Works"
                            >
                                <Code2 className="w-4 h-4" />
                                <span className="hidden lg:inline">How It Works</span>
                            </button>
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
                                    className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                                >
                                    {APP_NAME}
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4"
                                >
                                    {APP_TAGLINE}
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                                >
                                    Find your ideal canine companion using semantic search & embeddings,
                                    explore 300+ breeds, compare side-by-side, or chat with any breed using AI!
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

            {/* Technical Guide Modal */}
            <AnimatePresence>
                {showTechGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTechGuide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Code2 className="w-6 h-6 text-white" />
                                    <div>
                                        <h2 className="text-xl font-bold text-white">How {APP_NAME} Works</h2>
                                        <p className="text-indigo-200 text-sm">Technical Architecture & AI Pipeline</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTechGuide(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                                {/* Overview */}
                                <div className="mb-8">
                                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                                        This is a <strong className="text-gray-900 dark:text-white">production-grade RAG (Retrieval-Augmented Generation)</strong> application
                                        demonstrating semantic search, vector embeddings, and AI-powered interactions.
                                    </p>
                                </div>

                                {/* Architecture Diagram */}
                                <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-indigo-600" />
                                        System Architecture
                                    </h3>
                                    <div className="font-mono text-sm text-gray-700 dark:text-gray-300 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded">Quiz Answers</span>
                                            <span>→</span>
                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded">Text Profile</span>
                                            <span>→</span>
                                            <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/50 rounded">OpenAI Embedding</span>
                                            <span>→</span>
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded">pgvector Search</span>
                                            <span>→</span>
                                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 rounded">Top Matches</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Breakdown */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    {/* Find My Match */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Find My Match</h4>
                                        </div>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Converts 10 quiz answers into natural language profile</li>
                                            <li>• Generates 1536-dim embedding via OpenAI</li>
                                            <li>• Cosine similarity search against 300+ breed embeddings</li>
                                            <li>• Returns top 5 matches with explainable reasoning</li>
                                        </ul>
                                    </div>

                                    {/* Explore */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <Search className="w-4 h-4 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Explore Breeds</h4>
                                        </div>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Fetches all breeds from Supabase database</li>
                                            <li>• Client-side filtering by attributes</li>
                                            <li>• Lazy-loaded images with gradient fallbacks</li>
                                            <li>• Cross-feature state sharing (compare/chat)</li>
                                        </ul>
                                    </div>

                                    {/* Compare */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                                <GitCompare className="w-4 h-4 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Compare Breeds</h4>
                                        </div>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• D3.js radar chart for visual trait comparison</li>
                                            <li>• Normalizes text attributes to numeric scale</li>
                                            <li>• Up to 4 breeds with color-coded overlays</li>
                                            <li>• Side-by-side attribute cards</li>
                                        </ul>
                                    </div>

                                    {/* Chat */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                                                <MessageCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Chat with a Breed</h4>
                                        </div>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Claude API with breed-specific system prompt</li>
                                            <li>• Personality derived from temperament attributes</li>
                                            <li>• Energy level affects response style</li>
                                            <li>• Action parsing (*wags tail*) for immersion</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                <div className="mb-8">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        Tech Stack
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { name: 'Next.js 14', desc: 'App Router', color: 'bg-black dark:bg-white dark:text-black' },
                                            { name: 'FastAPI', desc: 'Python Backend', color: 'bg-green-600' },
                                            { name: 'Supabase', desc: 'PostgreSQL + pgvector', color: 'bg-emerald-600' },
                                            { name: 'OpenAI', desc: 'text-embedding-3-small', color: 'bg-gray-800' },
                                            { name: 'Claude', desc: 'Sonnet 4 for Chat', color: 'bg-orange-600' },
                                            { name: 'D3.js', desc: 'Data Visualization', color: 'bg-orange-500' },
                                            { name: 'Framer Motion', desc: 'Animations', color: 'bg-purple-600' },
                                            { name: 'TypeScript', desc: 'Type Safety', color: 'bg-blue-600' },
                                        ].map((tech) => (
                                            <div key={tech.name} className="text-center">
                                                <div className={`${tech.color} text-white text-xs font-bold px-3 py-2 rounded-lg mb-1`}>
                                                    {tech.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{tech.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Pipeline */}
                                <div className="mb-8">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-indigo-600" />
                                        Data Pipeline
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">1</div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Data Scraping</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Async scraping from dogapi.dog (283 breeds) + dog.ceo (images)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">2</div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Attribute Inference</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">NLP extracts traits from descriptions: &quot;energetic&quot; → High Energy</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center text-xs font-bold text-pink-600">3</div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Embedding Generation</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Rich breed profiles → 1536-dimensional vectors via OpenAI</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-xs font-bold text-green-600">4</div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">Vector Storage</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Supabase pgvector with IVFFlat index for fast similarity search</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/30 rounded-xl">
                                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">283</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Dog Breeds</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl">
                                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">1536</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Embedding Dims</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/30 rounded-xl">
                                        <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">&lt;200ms</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Search Latency</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
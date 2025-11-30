
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Quiz, { QuizAnswers } from './components/Quiz';
import MatchResults from './components/MatchResults';
import TechnicalGuide from './components/TechnicalGuide';
import { Loader2, Dog } from 'lucide-react';

type BreedMatch = {
    breed_id: string;
    name: string;
    description: string;
    similarity_score: number;
    match_reasons: string[];
    image_url: string;
    size_category: string;
    breed_group: string;
    temperament: string[];
    energy_level: string;
    exercise_needs: string;
    grooming_needs: string;
    shedding_level: string;
    apartment_friendly: boolean | null;
    good_with_kids: boolean | null;
    good_with_pets: boolean | null;
    images: string[];
};

export default function DogMatcherPage() {
    const [stage, setStage] = useState<'intro' | 'quiz' | 'loading' | 'results'>('intro');
    const [matches, setMatches] = useState<BreedMatch[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleQuizComplete = async (answers: QuizAnswers) => {
        setStage('loading');
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dog-matcher/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quiz_answers: answers,
                    top_k: 5
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch matches');
            }

            const data = await response.json();
            setMatches(data.matches);
            setStage('results');
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError('Something went wrong finding your matches. Please try again.');
            setStage('quiz');
        }
    };

    const handleRestart = () => {
        setStage('intro');
        setMatches([]);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12">
            {stage === 'intro' && (
                <div className="max-w-4xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        {/* Logo / Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-8 shadow-2xl"
                        >
                            <Dog className="w-12 h-12 text-white" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                        >
                            Find Your Perfect Dog Breed
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
                        >
                            Answer a few questions about your lifestyle, and our AI will match you with ideal dog breeds using advanced semantic search and embeddings.
                        </motion.p>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="grid md:grid-cols-3 gap-6 mb-12"
                        >
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-4xl mb-3">🧠</div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    AI-Powered Matching
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Using embeddings and semantic search to find your perfect match
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-4xl mb-3">🎯</div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    Personalized Results
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Tailored recommendations based on your lifestyle and preferences
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-4xl mb-3">📊</div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    Detailed Insights
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Comprehensive breed information and match reasoning
                                </p>
                            </div>
                        </motion.div>

                        <TechnicalGuide />

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStage('quiz')}
                            className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all"
                        >
                            Start Quiz →
                        </motion.button>
                    </motion.div>
                </div>
            )}

            {stage === 'quiz' && (
                <div>
                    {error && (
                        <div className="max-w-3xl mx-auto px-4 mb-6">
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        </div>
                    )}
                    <Quiz onComplete={handleQuizComplete} />
                </div>
            )}

            {stage === 'loading' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block mb-6"
                        >
                            <Loader2 className="w-16 h-16 text-indigo-600" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Finding Your Perfect Matches...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Analyzing over 300 breeds with AI
                        </p>
                    </motion.div>
                </div>
            )}

            {stage === 'results' && matches.length > 0 && (
                <MatchResults matches={matches} onRestart={handleRestart} />
            )}
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Sparkles, Zap, Home, Users, Scissors, Wind } from 'lucide-react';

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

type MatchResultsProps = {
    matches: BreedMatch[];
    onRestart: () => void;
};

export default function MatchResults({ matches, onRestart }: MatchResultsProps) {
    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-6 py-3 rounded-full mb-4"
                >
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                        Your Perfect Matches
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                >
                    Found {matches.length} Amazing Breeds For You!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-gray-600 dark:text-gray-400"
                >
                    Based on your lifestyle and preferences
                </motion.p>
            </motion.div>

            {/* Match cards */}
            <div className="space-y-6 mb-12">
                {matches.map((match, index) => (
                    <motion.div
                        key={match.breed_id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        <div className="grid md:grid-cols-[300px,1fr] gap-6">
                            {/* Image or Placeholder */}
                            <div className="relative h-64 md:h-full overflow-hidden">
                                {match.image_url ? (
                                    <>
                                        <div className="relative h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                            <Image
                                                src={match.image_url}
                                                alt={match.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className={`relative h-full flex flex-col items-center justify-center ${match.size_category === 'Small'
                                        ? 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600'
                                        : match.size_category === 'Medium'
                                            ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                                            : 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600'
                                        }`}>
                                        {/* Animated background pattern */}
                                        <motion.div
                                            className="absolute inset-0 opacity-20"
                                            animate={{
                                                backgroundPosition: ['0% 0%', '100% 100%'],
                                            }}
                                            transition={{
                                                duration: 20,
                                                repeat: Infinity,
                                                repeatType: 'reverse',
                                            }}
                                            style={{
                                                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                                backgroundSize: '30px 30px',
                                            }}
                                        />

                                        {/* Breed initials */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.1, type: 'spring' }}
                                            className="relative z-10 text-white"
                                        >
                                            <div className="text-8xl md:text-9xl font-bold opacity-90 mb-4">
                                                {match.name
                                                    .split(' ')
                                                    .map(word => word[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                }
                                            </div>
                                            <div className="text-center">
                                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-lg font-semibold">
                                                    {match.size_category} Breed
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Size indicator icon */}
                                        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-full text-2xl">
                                            {match.size_category === 'Small' ? '🐕' : match.size_category === 'Medium' ? '🦮' : '🐕‍🦺'}
                                        </div>
                                    </div>
                                )}

                                {/* Match rank badge */}
                                {index === 0 && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.5, type: 'spring' }}
                                        className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 z-20"
                                    >
                                        <Heart className="w-5 h-5 fill-current" />
                                        #1 Match
                                    </motion.div>
                                )}

                                {/* Match score */}
                                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-indigo-600 dark:text-indigo-400 shadow-lg z-20">
                                    {match.similarity_score}% Match
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                                            {match.name}
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                                                {match.size_category}
                                            </span>
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                                {match.breed_group}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                    {match.description}
                                </p>

                                {/* Match reasons */}
                                {match.match_reasons.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            Why This Match
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {match.match_reasons.map((reason, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 + i * 0.05 }}
                                                    className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-800"
                                                >
                                                    ✓ {reason}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Zap className="w-4 h-4 text-yellow-600" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {match.energy_level} Energy
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Scissors className="w-4 h-4 text-pink-600" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {match.grooming_needs} Grooming
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Wind className="w-4 h-4 text-blue-600" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {match.shedding_level} Shedding
                                        </span>
                                    </div>
                                    {match.apartment_friendly !== null && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Home className="w-4 h-4 text-green-600" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {match.apartment_friendly ? 'Apt Friendly' : 'Needs Space'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Temperament tags */}
                                {match.temperament.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            {match.temperament.map((trait, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                                >
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Restart button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: matches.length * 0.1 + 0.3 }}
                className="text-center"
            >
                <motion.button
                    onClick={onRestart}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    Take Quiz Again
                </motion.button>
            </motion.div>
        </div>
    );
}

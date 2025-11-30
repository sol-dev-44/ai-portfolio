'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Sparkles, Zap, Home, Scissors, Wind, MessageCircle, GitCompare, Check } from 'lucide-react';

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
    onStartChat?: (breedId: string) => void;
    onAddToCompare?: (breedId: string) => void;
    selectedForCompare?: string[];
};

export default function MatchResults({
    matches,
    onRestart,
    onStartChat,
    onAddToCompare,
    selectedForCompare = []
}: MatchResultsProps) {
    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-5 py-2 rounded-full mb-4"
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
                    className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                >
                    Found {matches.length} Amazing Breeds!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400"
                >
                    Based on your lifestyle and preferences
                </motion.p>
            </motion.div>

            {/* Match cards */}
            <div className="space-y-6 mb-10">
                {matches.map((match, index) => {
                    const isSelectedForCompare = selectedForCompare.includes(match.breed_id);

                    return (
                        <motion.div
                            key={match.breed_id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                            <div className="grid md:grid-cols-[280px,1fr] gap-0">
                                {/* Image or Placeholder */}
                                <div className="relative h-56 md:h-full overflow-hidden">
                                    {match.image_url ? (
                                        <div className="relative h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                            <Image
                                                src={match.image_url}
                                                alt={match.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`relative h-full flex flex-col items-center justify-center ${match.size_category === 'Small'
                                                ? 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600'
                                                : match.size_category === 'Medium'
                                                    ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                                                    : 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600'
                                            }`}>
                                            <motion.div
                                                className="absolute inset-0 opacity-20"
                                                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                                                transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                                                style={{
                                                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                                    backgroundSize: '30px 30px',
                                                }}
                                            />
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: index * 0.1, type: 'spring' }}
                                                className="relative z-10 text-white"
                                            >
                                                <div className="text-7xl font-bold opacity-90 mb-2">
                                                    {match.name.split(' ').map(word => word[0]).slice(0, 2).join('')}
                                                </div>
                                                <div className="text-center">
                                                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                                                        {match.size_category} Breed
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Match rank badge */}
                                    {index === 0 && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.5, type: 'spring' }}
                                            className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 z-20 text-sm"
                                        >
                                            <Heart className="w-4 h-4 fill-current" />
                                            #1 Match
                                        </motion.div>
                                    )}

                                    {/* Match score */}
                                    <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-indigo-600 dark:text-indigo-400 shadow-lg z-20 text-sm">
                                        {match.similarity_score}% Match
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-1.5 text-gray-900 dark:text-white">
                                                {match.name}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                                                    {match.size_category}
                                                </span>
                                                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                                    {match.breed_group}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {onStartChat && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onStartChat(match.breed_id)}
                                                    className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                                                    title="Chat with this breed"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </motion.button>
                                            )}
                                            {onAddToCompare && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onAddToCompare(match.breed_id)}
                                                    className={`p-2 rounded-lg transition-colors ${isSelectedForCompare
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                        }`}
                                                    title={isSelectedForCompare ? 'Remove from compare' : 'Add to compare'}
                                                >
                                                    {isSelectedForCompare ? (
                                                        <Check className="w-5 h-5" />
                                                    ) : (
                                                        <GitCompare className="w-5 h-5" />
                                                    )}
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 text-sm">
                                        {match.description}
                                    </p>

                                    {/* Match reasons */}
                                    {match.match_reasons.length > 0 && (
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5 text-sm">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                                Why This Match
                                            </h3>
                                            <div className="flex flex-wrap gap-1.5">
                                                {match.match_reasons.map((reason, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.1 + i * 0.05 }}
                                                        className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs border border-green-200 dark:border-green-800"
                                                    >
                                                        ✓ {reason}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Zap className="w-3.5 h-3.5 text-yellow-600" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {match.energy_level} Energy
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Scissors className="w-3.5 h-3.5 text-pink-600" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {match.grooming_needs} Grooming
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Wind className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {match.shedding_level} Shedding
                                            </span>
                                        </div>
                                        {match.apartment_friendly !== null && (
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Home className="w-3.5 h-3.5 text-green-600" />
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {match.apartment_friendly ? 'Apt Friendly' : 'Needs Space'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Temperament tags */}
                                    {match.temperament.length > 0 && (
                                        <div className="mt-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {match.temperament.map((trait, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
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
                    );
                })}
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
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    Take Quiz Again
                </motion.button>
            </motion.div>
        </div>
    );
}
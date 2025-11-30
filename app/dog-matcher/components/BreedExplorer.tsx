'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Filter, X, Heart, MessageCircle, GitCompare, ArrowRight } from 'lucide-react';

type Breed = {
    breed_id: string;
    name: string;
    description: string;
    size_category: string;
    breed_group: string;
    energy_level: string;
    temperament: string[];
    image_urls: string[];
    apartment_friendly: boolean | null;
    good_with_kids: boolean | null;
    shedding_level: string;
    hypoallergenic: boolean;
};

type BreedExplorerProps = {
    onCompare: (breedId: string) => void;
    selectedBreeds: string[];
    onStartChat: (breedId: string) => void;
    onGoToCompare: () => void;
};

export default function BreedExplorer({ onCompare, selectedBreeds, onStartChat, onGoToCompare }: BreedExplorerProps) {
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        size: 'all',
        energy: 'all',
        kids: 'all',
        apartment: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Fetch breeds on mount
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dog-matcher/breeds`)
            .then(res => res.json())
            .then(data => {
                setBreeds(data.breeds || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching breeds:', err);
                setLoading(false);
            });
    }, []);

    // Filter breeds
    const filteredBreeds = useMemo(() => {
        return breeds.filter(breed => {
            // Search filter
            if (searchQuery && !breed.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !breed.description.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Size filter
            if (filters.size !== 'all' && breed.size_category !== filters.size) {
                return false;
            }

            // Energy filter
            if (filters.energy !== 'all' && breed.energy_level !== filters.energy) {
                return false;
            }

            // Kids filter
            if (filters.kids === 'yes' && !breed.good_with_kids) {
                return false;
            }
            if (filters.kids === 'no' && breed.good_with_kids) {
                return false;
            }

            // Apartment filter
            if (filters.apartment === 'yes' && !breed.apartment_friendly) {
                return false;
            }
            if (filters.apartment === 'no' && breed.apartment_friendly) {
                return false;
            }

            return true;
        });
    }, [breeds, searchQuery, filters]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading breeds...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Explore All Breeds
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Browse, search, and compare {breeds.length} dog breeds
                </p>
            </div>

            {/* Compare Bar - Fixed when breeds selected */}
            <AnimatePresence>
                {selectedBreeds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <GitCompare className="w-5 h-5 text-orange-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                                {selectedBreeds.length} breed{selectedBreeds.length > 1 ? 's' : ''} selected for comparison
                            </span>
                            <span className="text-sm text-gray-500">
                                (max 4)
                            </span>
                        </div>
                        <button
                            onClick={onGoToCompare}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                            Compare Now
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search breeds by name or description..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {Object.values(filters).some(f => f !== 'all') && (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                            Active
                        </span>
                    )}
                </button>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Size</label>
                                <select
                                    value={filters.size}
                                    onChange={(e) => setFilters({ ...filters, size: e.target.value })}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Sizes</option>
                                    <option value="Small">Small</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Large">Large</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Energy</label>
                                <select
                                    value={filters.energy}
                                    onChange={(e) => setFilters({ ...filters, energy: e.target.value })}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Levels</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Very High">Very High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Good with Kids</label>
                                <select
                                    value={filters.kids}
                                    onChange={(e) => setFilters({ ...filters, kids: e.target.value })}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Apartment Friendly</label>
                                <select
                                    value={filters.apartment}
                                    onChange={(e) => setFilters({ ...filters, apartment: e.target.value })}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
                Showing {filteredBreeds.length} of {breeds.length} breeds
            </div>

            {/* Breed Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredBreeds.map((breed, index) => {
                    const isSelected = selectedBreeds.includes(breed.breed_id);
                    const imageUrl = breed.image_urls?.[0];

                    return (
                        <motion.div
                            key={breed.breed_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.02, 0.5) }}
                            className={`group bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all ${isSelected
                                    ? 'border-orange-500 shadow-lg ring-2 ring-orange-200 dark:ring-orange-900'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {/* Image */}
                            <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={breed.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className={`relative h-full flex items-center justify-center ${breed.size_category === 'Small'
                                            ? 'bg-gradient-to-br from-rose-400 to-pink-600'
                                            : breed.size_category === 'Medium'
                                                ? 'bg-gradient-to-br from-blue-400 to-indigo-600'
                                                : 'bg-gradient-to-br from-emerald-400 to-teal-600'
                                        }`}>
                                        <div className="text-5xl font-bold text-white opacity-90">
                                            {breed.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                        </div>
                                    </div>
                                )}

                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 p-2 bg-orange-500 rounded-full shadow-lg">
                                        <Heart className="w-4 h-4 text-white fill-current" />
                                    </div>
                                )}

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onStartChat(breed.breed_id)}
                                        className="p-3 bg-pink-500 text-white rounded-full shadow-lg"
                                        title="Chat with this breed"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onCompare(breed.breed_id)}
                                        className={`p-3 rounded-full shadow-lg ${isSelected
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-white text-orange-500'
                                            }`}
                                        title={isSelected ? 'Remove from compare' : 'Add to compare'}
                                    >
                                        <GitCompare className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                                    {breed.name}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300">
                                        {breed.size_category}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300">
                                        {breed.energy_level} Energy
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {breed.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredBreeds.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        No breeds found matching your criteria
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilters({ size: 'all', energy: 'all', kids: 'all', apartment: 'all' });
                        }}
                        className="mt-4 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}
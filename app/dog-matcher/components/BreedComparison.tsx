'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import * as d3 from 'd3';
import { X, TrendingUp, MessageCircle, Search } from 'lucide-react';

type Breed = {
    breed_id: string;
    name: string;
    description: string;
    size_category: string;
    breed_group: string;
    energy_level: string;
    exercise_needs: string;
    grooming_needs: string;
    shedding_level: string;
    trainability: string;
    temperament: string[];
    image_urls: string[];
    apartment_friendly: boolean | null;
    good_with_kids: boolean | null;
    good_with_pets: boolean | null;
    hypoallergenic: boolean;
};

type BreedComparisonProps = {
    selectedBreedIds: string[];
    onRemoveBreed: (breedId: string) => void;
    onStartChat: (breedId: string) => void;
    onExploreMore: () => void;
};

// Convert text levels to numbers for radar chart
const levelToNumber = (level: string | null): number => {
    if (!level) return 2;
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('very high') || lowerLevel.includes('extensive')) return 5;
    if (lowerLevel.includes('high')) return 4;
    if (lowerLevel.includes('medium') || lowerLevel.includes('moderate')) return 3;
    if (lowerLevel.includes('low') || lowerLevel.includes('minimal')) return 2;
    return 2;
};

const RadarChart = ({ breeds }: { breeds: Breed[] }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || breeds.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 350;
        const height = 350;
        const margin = 50;
        const radius = Math.min(width, height) / 2 - margin;

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Metrics to compare
        const metrics = [
            { key: 'energy_level', label: 'Energy' },
            { key: 'exercise_needs', label: 'Exercise' },
            { key: 'trainability', label: 'Trainability' },
            { key: 'grooming_needs', label: 'Grooming' },
            { key: 'shedding_level', label: 'Shedding' }
        ];

        const angleSlice = (Math.PI * 2) / metrics.length;

        // Scales
        const rScale = d3.scaleLinear().domain([0, 5]).range([0, radius]);

        // Draw circular grid
        const levels = 5;
        for (let i = 1; i <= levels; i++) {
            const levelRadius = radius * (i / levels);
            g.append('circle')
                .attr('r', levelRadius)
                .attr('fill', 'none')
                .attr('stroke', '#e5e7eb')
                .attr('stroke-width', 1)
                .attr('opacity', 0.5);
        }

        // Draw axes
        const axes = g.selectAll('.axis')
            .data(metrics)
            .enter()
            .append('g')
            .attr('class', 'axis');

        axes.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', (_d, i) => rScale(5) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr('y2', (_d, i) => rScale(5) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr('stroke', '#d1d5db')
            .attr('stroke-width', 1);

        // Add axis labels
        axes.append('text')
            .attr('x', (_d, i) => rScale(5.5) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr('y', (_d, i) => rScale(5.5) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', '#6b7280')
            .text(d => d.label);

        // Color scale for breeds - more distinct colors
        const colors = ['#6366f1', '#ec4899', '#10b981', '#f97316'];

        // Draw breed polygons - REVERSE order so first breed is on top
        [...breeds].reverse().forEach((breed, reverseIndex) => {
            const breedIndex = breeds.length - 1 - reverseIndex;
            const dataPoints = metrics.map((metric, i) => {
                const value = levelToNumber(breed[metric.key as keyof Breed] as string);
                return {
                    x: rScale(value) * Math.cos(angleSlice * i - Math.PI / 2),
                    y: rScale(value) * Math.sin(angleSlice * i - Math.PI / 2),
                    value
                };
            });

            // Create path
            const pathData = dataPoints.map((d, i) =>
                `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`
            ).join(' ') + ' Z';

            g.append('path')
                .attr('d', pathData)
                .attr('fill', colors[breedIndex % colors.length])
                .attr('fill-opacity', 0.1)
                .attr('stroke', colors[breedIndex % colors.length])
                .attr('stroke-width', 2.5)
                .attr('stroke-opacity', 0.9);

            // Add dots
            dataPoints.forEach((d) => {
                g.append('circle')
                    .attr('cx', d.x)
                    .attr('cy', d.y)
                    .attr('r', 5)
                    .attr('fill', colors[breedIndex % colors.length])
                    .attr('stroke', 'white')
                    .attr('stroke-width', 2);
            });
        });

    }, [breeds]);

    return (
        <div className="flex justify-center">
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default function BreedComparison({ selectedBreedIds, onRemoveBreed, onStartChat, onExploreMore }: BreedComparisonProps) {
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedBreedIds.length === 0) {
            setBreeds([]);
            setLoading(false);
            return;
        }

        // Fetch all breeds and filter selected ones
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dog-matcher/breeds`)
            .then(res => res.json())
            .then(data => {
                const allBreeds = data.breeds || [];
                const selected = allBreeds.filter((b: Breed) =>
                    selectedBreedIds.includes(b.breed_id)
                );
                setBreeds(selected);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching breeds:', err);
                setLoading(false);
            });
    }, [selectedBreedIds]);

    if (selectedBreedIds.length === 0) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                        Select Breeds to Compare
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
                        Go to Explore mode and click on 2-4 breeds to see detailed side-by-side comparisons
                    </p>
                    <button
                        onClick={onExploreMore}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                        <Search className="w-5 h-5" />
                        Browse Breeds
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading comparison...</p>
                </div>
            </div>
        );
    }

    const colors = [
        { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30' },
        { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30' },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Breed Comparison
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Comparing {breeds.length} breeds side-by-side
                </p>
            </div>

            {/* Radar Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-lg"
            >
                <h2 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-white">
                    Trait Comparison
                </h2>
                <RadarChart breeds={breeds} />

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {breeds.map((breed, index) => (
                        <div key={breed.breed_id} className="flex items-center gap-2">
                            <div
                                className={`w-4 h-4 rounded-full ${colors[index % colors.length].bg}`}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{breed.name}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Side-by-side Cards */}
            <div className={`grid gap-5 ${breeds.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
                    breeds.length === 2 ? 'md:grid-cols-2' :
                        breeds.length === 3 ? 'md:grid-cols-3' :
                            'md:grid-cols-2 lg:grid-cols-4'
                }`}>
                {breeds.map((breed, index) => {
                    const imageUrl = breed.image_urls?.[0];
                    const colorSet = colors[index % colors.length];

                    return (
                        <motion.div
                            key={breed.breed_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white dark:bg-gray-800 rounded-2xl border-2 overflow-hidden hover:shadow-xl transition-shadow ${colorSet.light} border-opacity-50`}
                            style={{ borderColor: `var(--${colorSet.bg.replace('bg-', '')})` }}
                        >
                            {/* Image */}
                            <div className="relative h-44">
                                {imageUrl ? (
                                    <Image src={imageUrl} alt={breed.name} fill className="object-cover" />
                                ) : (
                                    <div className={`h-full flex items-center justify-center bg-gradient-to-br ${breed.size_category === 'Small'
                                            ? 'from-rose-400 to-pink-600'
                                            : breed.size_category === 'Medium'
                                                ? 'from-blue-400 to-indigo-600'
                                                : 'from-emerald-400 to-teal-600'
                                        }`}>
                                        <div className="text-5xl font-bold text-white opacity-90">
                                            {breed.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                        </div>
                                    </div>
                                )}

                                {/* Remove button */}
                                <button
                                    onClick={() => onRemoveBreed(breed.breed_id)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-md"
                                >
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </button>

                                {/* Chat button */}
                                <button
                                    onClick={() => onStartChat(breed.breed_id)}
                                    className="absolute top-2 left-2 p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors shadow-md"
                                    title="Chat with this breed"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>

                                {/* Color indicator */}
                                <div className={`absolute bottom-2 left-2 w-4 h-4 rounded-full ${colorSet.bg} shadow-md`} />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
                                    {breed.name}
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Size:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{breed.size_category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Group:</span>
                                        <span className="font-medium text-gray-900 dark:text-white text-right">{breed.breed_group}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Energy:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{breed.energy_level}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Trainability:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{breed.trainability}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Grooming:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{breed.grooming_needs}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Shedding:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{breed.shedding_level}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400 block mb-1.5 text-xs">Special Traits:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {breed.apartment_friendly && (
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                                                    Apt Friendly
                                                </span>
                                            )}
                                            {breed.good_with_kids && (
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                                    Good w/ Kids
                                                </span>
                                            )}
                                            {breed.hypoallergenic && (
                                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                                                    Hypoallergenic
                                                </span>
                                            )}
                                            {!breed.apartment_friendly && !breed.good_with_kids && !breed.hypoallergenic && (
                                                <span className="text-xs text-gray-400">None listed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Add more breeds button */}
            {breeds.length < 4 && (
                <div className="mt-8 text-center">
                    <button
                        onClick={onExploreMore}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        + Add more breeds to compare
                    </button>
                </div>
            )}
        </div>
    );
}
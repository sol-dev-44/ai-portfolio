'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    BrainCircuit,
    Palette,
    Sparkles,
    ChevronDown,
    Zap,
    Code,
    Layers,
    BarChart3,
    Workflow
} from 'lucide-react';

export function TechBreakdown() {
    const [isOpen, setIsOpen] = useState(false);

    const pipeline = [
        {
            icon: Eye,
            title: "Image Analysis",
            desc: "Claude 3.5 Sonnet vision model analyzes your image to extract emotional dimensions (valence, arousal), detect moods, identify visual style attributes (contrast, brightness, warmth, sharpness), and generate a semantic description of the scene.",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Palette,
            title: "Color Extraction",
            desc: "Advanced color quantization algorithm extracts the dominant 5-color palette from your image, analyzing hue, saturation, and luminance to identify the most representative colors that define the image's emotional tone.",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: BarChart3,
            title: "Emotion Mapping",
            desc: "Sentiment scores are mapped to the Valence-Arousal-Dominance (VAD) emotional model. Valence measures positivity (-1 to 1), arousal measures energy (0 to 1), and dominance measures control (0 to 1). These drive all visualizations.",
            color: "from-orange-500 to-red-500"
        },
        {
            icon: Sparkles,
            title: "Generative Rendering",
            desc: "React Three Fiber renders a real-time 3D scene with a distorting sphere. The distortion intensity is driven by arousal (energy), particle count by arousal, and colors from your extracted palette. Post-processing effects (bloom, vignette) adapt to style attributes.",
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Layers,
            title: "Multi-Viz Display",
            desc: "Four synchronized visualizations display your image's emotional signature: a radar chart for emotional dimensions, a color harmony wheel showing palette relationships, an animated particle flow representing sentiment energy, and an emotion spectrum breakdown.",
            color: "from-indigo-500 to-purple-500"
        },
        {
            icon: Workflow,
            title: "Compare Mode",
            desc: "When comparing two images, we calculate emotional distance using Euclidean distance in 3D VAD space, analyze palette overlap, compare mood keywords, and visualize style attribute differences with dual radar charts and side-by-side generative scenes.",
            color: "from-pink-500 to-rose-500"
        }
    ];

    return (
        <div className="max-w-6xl mx-auto w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border-2 border-purple-500/30 dark:border-purple-500/40 hover:border-purple-500/50 dark:hover:border-purple-500/60 transition-all group shadow-lg hover:shadow-xl"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform shadow-md">
                        <Code className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            How It Works
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            AI Vision → Emotion Mapping → Generative Art
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                            {pipeline.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + (i * 0.08) }}
                                    className="group relative p-6 rounded-xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-transparent hover:shadow-xl transition-all duration-300"
                                >
                                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    <div className="relative space-y-3">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-md`}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-neutral-400 dark:text-neutral-600">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <h3 className="text-neutral-900 dark:text-white font-bold text-lg">
                                                        {item.title}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 p-5 rounded-xl bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-2 border-purple-200 dark:border-purple-500/30"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h4 className="font-bold text-purple-900 dark:text-purple-300">Tech Stack</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Three.js / R3F', 'Redux Toolkit', 'Claude 3.5 Sonnet', 'Recharts', 'Lucide Icons'].map((tech, i) => (
                                    <div key={i} className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-neutral-800/60 border border-purple-200 dark:border-purple-500/20">
                                        <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                                            {tech}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

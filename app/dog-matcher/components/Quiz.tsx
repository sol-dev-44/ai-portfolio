'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export type QuizAnswers = {
    living_situation: string;
    activity_level: string;
    experience: string;
    size_preference: string;
    exercise_commitment: string;
    grooming_tolerance: string;
    shedding_tolerance: string;
    family_situation: string;
    temperament_preference: string[];
    training_commitment: string;
};

type QuizProps = {
    onComplete: (answers: QuizAnswers) => void;
};

const QUESTIONS = [
    {
        id: 'living_situation',
        question: 'What\'s your living situation?',
        type: 'single',
        options: [
            { value: 'apartment', label: 'Apartment', emoji: '🏢' },
            { value: 'house-small-yard', label: 'House with small yard', emoji: '🏡' },
            { value: 'house-large-yard', label: 'House with large yard', emoji: '🏘️' },
            { value: 'farm', label: 'Farm / Acreage', emoji: '🌾' }
        ]
    },
    {
        id: 'activity_level',
        question: 'How would you describe your activity level?',
        type: 'single',
        options: [
            { value: 'sedentary', label: 'Mostly indoors, relaxing', emoji: '🛋️' },
            { value: 'moderate', label: 'Regular walks, some outdoor time', emoji: '🚶' },
            { value: 'active', label: 'Frequent hiking & outdoor activities', emoji: '🥾' },
            { value: 'very-active', label: 'Running, intense exercise daily', emoji: '🏃' }
        ]
    },
    {
        id: 'experience',
        question: 'What\'s your experience with dogs?',
        type: 'single',
        options: [
            { value: 'first-time', label: 'First-time owner', emoji: '🌱' },
            { value: 'some-experience', label: 'Some experience', emoji: '📚' },
            { value: 'experienced', label: 'Very experienced', emoji: '🎓' }
        ]
    },
    {
        id: 'size_preference',
        question: 'What size dog do you prefer?',
        type: 'single',
        options: [
            { value: 'small', label: 'Small (under 25 lbs)', emoji: '🐕' },
            { value: 'medium', label: 'Medium (25-60 lbs)', emoji: '🦮' },
            { value: 'large', label: 'Large (over 60 lbs)', emoji: '🐕‍🦺' },
            { value: 'any', label: 'Any size is fine', emoji: '❤️' }
        ]
    },
    {
        id: 'exercise_commitment',
        question: 'How much daily exercise can you provide?',
        type: 'single',
        options: [
            { value: '15min', label: '15-30 minutes', emoji: '⏱️' },
            { value: '30-60min', label: '30-60 minutes', emoji: '⏰' },
            { value: '60-120min', label: '1-2 hours', emoji: '🕐' },
            { value: '2plus-hours', label: '2+ hours', emoji: '🕒' }
        ]
    },
    {
        id: 'grooming_tolerance',
        question: 'How much grooming are you willing to do?',
        type: 'single',
        options: [
            { value: 'minimal', label: 'Minimal maintenance', emoji: '✨' },
            { value: 'moderate', label: 'Moderate grooming', emoji: '✂️' },
            { value: 'high', label: 'High maintenance OK', emoji: '💎' }
        ]
    },
    {
        id: 'shedding_tolerance',
        question: 'How do you feel about shedding?',
        type: 'single',
        options: [
            { value: 'minimal', label: 'Prefer minimal/no shedding', emoji: '🚫' },
            { value: 'moderate', label: 'Moderate shedding OK', emoji: '🌬️' },
            { value: 'heavy', label: 'Heavy shedding is fine', emoji: '🌨️' }
        ]
    },
    {
        id: 'family_situation',
        question: 'What\'s your household like?',
        type: 'single',
        options: [
            { value: 'single', label: 'Single person', emoji: '👤' },
            { value: 'couple', label: 'Couple, no children', emoji: '👥' },
            { value: 'kids-young', label: 'Young children (under 10)', emoji: '👨‍👩‍👧' },
            { value: 'kids-older', label: 'Older children/teens', emoji: '👨‍👩‍👧‍👦' },
            { value: 'other-pets', label: 'Other pets at home', emoji: '🐾' }
        ]
    },
    {
        id: 'temperament_preference',
        question: 'What temperament traits do you value? (Select all that apply)',
        type: 'multiple',
        options: [
            { value: 'calm', label: 'Calm', emoji: '😌' },
            { value: 'playful', label: 'Playful', emoji: '🎾' },
            { value: 'protective', label: 'Protective', emoji: '🛡️' },
            { value: 'independent', label: 'Independent', emoji: '🦅' },
            { value: 'friendly', label: 'Friendly', emoji: '😊' },
            { value: 'energetic', label: 'Energetic', emoji: '⚡' }
        ]
    },
    {
        id: 'training_commitment',
        question: 'How much training can you commit to?',
        type: 'single',
        options: [
            { value: 'basic', label: 'Basic training only', emoji: '📖' },
            { value: 'moderate', label: 'Moderate training', emoji: '🎯' },
            { value: 'extensive', label: 'Extensive training OK', emoji: '🏆' }
        ]
    }
];

export default function Quiz({ onComplete }: QuizProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
        temperament_preference: []
    });
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

    const currentQuestion = QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

    const handleAnswer = (value: string) => {
        if (currentQuestion.type === 'multiple') {
            const current = answers.temperament_preference || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            setAnswers({ ...answers, temperament_preference: updated });
        } else {
            setAnswers({ ...answers, [currentQuestion.id]: value });
        }
    };

    const canProgress = () => {
        if (currentQuestion.type === 'multiple') {
            return (answers.temperament_preference || []).length > 0;
        }
        return currentQuestion.id in answers;
    };

    const nextStep = () => {
        if (currentStep < QUESTIONS.length - 1) {
            setDirection('forward');
            setCurrentStep(currentStep + 1);
        } else if (canProgress()) {
            onComplete(answers as QuizAnswers);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection('backward');
            setCurrentStep(currentStep - 1);
        }
    };

    const variants = {
        enter: (direction: 'forward' | 'backward') => ({
            x: direction === 'forward' ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: 'forward' | 'backward') => ({
            x: direction === 'forward' ? -300 : 300,
            opacity: 0
        })
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Question {currentStep + 1} of {QUESTIONS.length}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
                >
                    <motion.h2
                        className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {currentQuestion.question}
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = currentQuestion.type === 'multiple'
                                ? (answers.temperament_preference || []).includes(option.value)
                                : answers[currentQuestion.id as keyof QuizAnswers] === option.value;

                            return (
                                <motion.button
                                    key={option.value}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAnswer(option.value)}
                                    className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                        }
                  `}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="selected-indicator"
                                            className="absolute top-3 right-3"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        >
                                            <Sparkles className="w-5 h-5 text-indigo-600" />
                                        </motion.div>
                                    )}
                                    <div className="text-4xl mb-3">{option.emoji}</div>
                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                        {option.label}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                <motion.button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${currentStep === 0
                            ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-800'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
          `}
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </motion.button>

                <motion.button
                    onClick={nextStep}
                    disabled={!canProgress()}
                    whileHover={canProgress() ? { scale: 1.05 } : {}}
                    whileTap={canProgress() ? { scale: 0.95 } : {}}
                    className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${canProgress()
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                            : 'opacity-40 cursor-not-allowed bg-gray-300 dark:bg-gray-700'
                        }
          `}
                >
                    {currentStep === QUESTIONS.length - 1 ? 'Find My Match' : 'Next'}
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
    );
}

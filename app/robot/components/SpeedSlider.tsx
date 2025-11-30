'use client';

import { motion } from 'framer-motion';

interface SpeedSliderProps {
    speed: number;
    onSpeedChange: (speed: number) => void;
}

export default function SpeedSlider({ speed, onSpeedChange }: SpeedSliderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xl flex items-center gap-6"
        >
            <h3 className="text-sm font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap">
                Animation Speed
            </h3>
            <div className="flex items-center gap-4 flex-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Slow</span>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gradient-to-r from-green-400 to-teal-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Fast</span>
                <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-bold text-xs min-w-[2.5rem] text-center">
                    {speed.toFixed(1)}x
                </div>
            </div>
        </motion.div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface SpeechControlProps {
    onCommandParsed: (action: string, expression: string, speed?: number) => void;
}

export default function SpeechControl({ onCommandParsed }: SpeechControlProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([
        'Make him wave happily',
        'Dance excitedly',
        'Walk sadly',
        'Jump with excitement',
        'Look surprised and wave',
    ]);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for speech recognition support
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    handleProcessCommand(text);
                };

                recognitionRef.current.onerror = (event: any) => {
                    setError(`Speech recognition error: ${event.error}`);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const handleStartListening = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
            return;
        }

        setError('');
        setTranscript('');
        setIsListening(true);
        recognitionRef.current.start();
    };

    const handleStopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const handleProcessCommand = async (text: string) => {
        setIsProcessing(true);
        setError('');

        try {
            const response = await fetch('/api/robot/parse-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: text }),
            });

            if (!response.ok) {
                throw new Error('Failed to parse command');
            }

            const data = await response.json();
            onCommandParsed(data.action, data.expression, data.speed);
        } catch (err) {
            setError('Failed to process command. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setTranscript(suggestion);
        handleProcessCommand(suggestion);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-200 dark:border-purple-700 shadow-xl"
        >
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Voice Control
            </h3>

            {/* Voice Input Button */}
            <div className="flex flex-col items-center gap-4 mb-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isListening ? handleStopListening : handleStartListening}
                    disabled={isProcessing}
                    className={`relative p-8 rounded-full transition-all shadow-2xl ${isListening
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isProcessing ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    ) : isListening ? (
                        <MicOff className="w-12 h-12 text-white" />
                    ) : (
                        <Mic className="w-12 h-12 text-white" />
                    )}

                    {isListening && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-4 border-white/50"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </motion.button>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                    {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click to speak a command'}
                </p>
            </div>

            {/* Transcript Display */}
            <AnimatePresence>
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-purple-200 dark:border-purple-700"
                    >
                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">You said:</p>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">{transcript}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700"
                    >
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Suggestions */}
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2">Try saying:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-purple-200 dark:border-purple-700 transition-all"
                        >
                            "{suggestion}"
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

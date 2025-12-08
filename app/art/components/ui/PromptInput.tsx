'use client';

import { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { useInterpretPromptMutation } from '@/store/api/artApi';
import { setTargetParameters, setPrompt } from '@/store/artSlice';
import { Sparkles, Loader2 } from 'lucide-react';

export default function PromptInput() {
    const [input, setInput] = useState('');
    const dispatch = useDispatch();
    const [interpretPrompt, { isLoading }] = useInterpretPromptMutation();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        try {
            console.log('Submitting prompt:', input);
            const result = await interpretPrompt(input).unwrap();
            console.log('AI result received:', result);
            dispatch(setTargetParameters(result));
            dispatch(setPrompt(input));
            console.log('Dispatched to Redux');
        } catch (error) {
            console.error('Failed to interpret prompt:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter a feeling, scene, or emotion..."
                    className="w-full px-6 py-4 pr-14 bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                    )}
                </button>
            </div>
        </form>
    );
}

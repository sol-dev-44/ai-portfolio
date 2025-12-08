'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import GenerativeCanvas from './components/GenerativeCanvas';
import PromptInput from './components/ui/PromptInput';
import ControlBar from './components/ui/ControlBar';

export default function ArtPage() {
    const { currentPrompt } = useSelector((state: RootState) => state.art);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Canvas - always visible */}
            <GenerativeCanvas />

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top bar with current prompt */}
                {currentPrompt && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                        <div className="px-6 py-3 bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl">
                            <p className="text-white/60 text-sm font-medium italic">
                                &ldquo;{currentPrompt}&rdquo;
                            </p>
                        </div>
                    </div>
                )}

                {/* Instructions overlay (shows when no prompt) */}
                {!currentPrompt && (
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="text-center space-y-2">
                            <h1 className="text-6xl font-bold text-white/90 mb-4 drop-shadow-lg">
                                Living Generative Art
                            </h1>
                            <p className="text-xl text-white/70 drop-shadow">
                                Type a feeling, scene, or emotion to transform the art
                            </p>
                            <div className="flex gap-4 justify-center mt-8 text-sm text-white/50">
                                <span>&ldquo;cosmic loneliness&rdquo;</span>
                                <span>&ldquo;warm anxiety&rdquo;</span>
                                <span>&ldquo;underwater cathedral&rdquo;</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom UI */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="pointer-events-auto">
                            <PromptInput />
                        </div>
                        <div className="pointer-events-auto">
                            <ControlBar />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

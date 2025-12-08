'use client';

import { useDispatch } from 'react-redux';
import { setTargetParameters, setPrompt } from '@/store/artSlice';
import { presets } from '../../lib/parameterDefaults';
import { Dices, Settings, Camera, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

export default function ControlBar() {
    const dispatch = useDispatch();
    const [soundEnabled, setSoundEnabled] = useState(false);

    const handleRandom = () => {
        const presetNames = Object.keys(presets);
        const randomPreset = presetNames[Math.floor(Math.random() * presetNames.length)];
        const params = presets[randomPreset as keyof typeof presets];

        dispatch(setTargetParameters(params));
        dispatch(setPrompt(randomPreset));
    };

    const handleCapture = () => {
        // Create a canvas screenshot
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generative-art-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleRandom}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
            >
                <Dices className="w-4 h-4" />
                Random
            </button>

            <button
                onClick={handleCapture}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
            >
                <Camera className="w-4 h-4" />
                Capture
            </button>

            <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
            >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Sound
            </button>
        </div>
    );
}

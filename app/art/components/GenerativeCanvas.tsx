'use client';

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import VisualEngine from './VisualEngine';

export default function GenerativeCanvas() {
    const { currentParameters } = useSelector((state: RootState) => state.art);

    return (
        <div className="w-full h-screen fixed inset-0">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
            >
                {/* Ambient lighting */}
                <ambientLight intensity={0.5} />

                {/* Main visual engine */}
                <VisualEngine />

                {/* Post-processing effects */}
                <EffectComposer>
                    <Bloom
                        intensity={currentParameters.glow * 2}
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        blendFunction={BlendFunction.ADD}
                    />
                    <ChromaticAberration
                        offset={[0.001 * (1 - currentParameters.contrast), 0.001 * (1 - currentParameters.contrast)]}
                        blendFunction={BlendFunction.NORMAL}
                    />
                    <Vignette
                        offset={0.3}
                        darkness={0.5}
                        blendFunction={BlendFunction.NORMAL}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { updateCurrentParameters, finishTransition } from '@/store/artSlice';
import BackgroundLayer from './layers/BackgroundLayer';
import ParticleLayer from './layers/ParticleLayer';
import BlobLayer from './layers/BlobLayer';

// Smooth lerp helper
function lerp(start: number, end: number, alpha: number) {
    return start + (end - start) * alpha;
}

function lerpArray(start: string[], end: string[], alpha: number) {
    // For simplicity, just switch when alpha > 0.5
    return alpha > 0.5 ? end : start;
}

export default function VisualEngine() {
    const dispatch = useDispatch();
    const { currentParameters, targetParameters, isTransitioning } = useSelector(
        (state: RootState) => state.art
    );

    const transitionProgress = useRef(0);

    // Reset transition progress when new target parameters arrive
    useEffect(() => {
        if (isTransitioning) {
            console.log('New transition started', { targetParameters });
            transitionProgress.current = 0;
        }
    }, [isTransitioning, targetParameters]);

    useFrame((state, delta) => {
        if (isTransitioning) {
            // Smooth transition over 2 seconds
            transitionProgress.current += delta * 0.5;

            if (transitionProgress.current >= 1) {
                console.log('Transition complete');
                transitionProgress.current = 0;
                dispatch(finishTransition());
            } else {
                // Lerp all numeric parameters
                const smoothed = {
                    ...currentParameters,
                    energy: lerp(currentParameters.energy, targetParameters.energy, transitionProgress.current),
                    complexity: lerp(currentParameters.complexity, targetParameters.complexity, transitionProgress.current),
                    organicness: lerp(currentParameters.organicness, targetParameters.organicness, transitionProgress.current),
                    density: lerp(currentParameters.density, targetParameters.density, transitionProgress.current),
                    depth: lerp(currentParameters.depth, targetParameters.depth, transitionProgress.current),
                    glow: lerp(currentParameters.glow, targetParameters.glow, transitionProgress.current),
                    noiseScale: lerp(currentParameters.noiseScale, targetParameters.noiseScale, transitionProgress.current),
                    contrast: lerp(currentParameters.contrast, targetParameters.contrast, transitionProgress.current),
                    temperature: lerp(currentParameters.temperature, targetParameters.temperature, transitionProgress.current),
                    palette: lerpArray(currentParameters.palette, targetParameters.palette, transitionProgress.current),
                    mood: transitionProgress.current > 0.5 ? targetParameters.mood : currentParameters.mood,
                    elements: transitionProgress.current > 0.5 ? targetParameters.elements : currentParameters.elements,
                    shapes: transitionProgress.current > 0.5 ? targetParameters.shapes : currentParameters.shapes,
                    movement: transitionProgress.current > 0.5 ? targetParameters.movement : currentParameters.movement,
                };

                dispatch(updateCurrentParameters(smoothed));
            }
        }
    });

    const showBlobs = useMemo(
        () => currentParameters.elements.includes('blobs'),
        [currentParameters.elements]
    );

    const showParticles = useMemo(
        () => currentParameters.elements.includes('particles') || currentParameters.elements.includes('flow_field'),
        [currentParameters.elements]
    );

    // Calculate density bucket to prevent constant remounting
    // Buckets: 0-0.25, 0.25-0.5, 0.5-0.75, 0.75-1.0
    const densityBucket = Math.floor(currentParameters.density * 4);

    // Calculate complexity bucket  
    const complexityBucket = Math.floor(currentParameters.complexity * 4);

    return (
        <group>
            {/* Background gradient/fog */}
            <BackgroundLayer />

            {/* Organic blobs - remount when complexity changes significantly */}
            {showBlobs && <BlobLayer key={`blob-${complexityBucket}`} />}

            {/* Floating particles - remount when density changes significantly */}
            {showParticles && <ParticleLayer key={`particles-${densityBucket}`} />}
        </group>
    );
}

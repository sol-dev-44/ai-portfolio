'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

export default function ParticleLayer() {
    const { currentParameters } = useSelector((state: RootState) => state.art);
    const pointsRef = useRef<THREE.Points>(null);
    const velocitiesRef = useRef<Float32Array>();

    // Lock particle count at creation to prevent buffer resizing
    const particleCountRef = useRef<number>(Math.floor(currentParameters.density * 2000) + 500);
    const particleCount = particleCountRef.current;

    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random position in a cube
            positions[i3] = (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 5;

            // Random velocity based on movement type
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

            // Random color from palette
            const colorIndex = Math.floor(Math.random() * currentParameters.palette.length);
            const color = new THREE.Color(currentParameters.palette[colorIndex]);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        velocitiesRef.current = velocities;

        return { positions, colors };
    }, [particleCount, currentParameters.palette]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = velocitiesRef.current!;
        const time = state.clock.elapsedTime;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            // Noise-based movement
            const noiseScale = currentParameters.noiseScale * 0.5;
            const noiseX = noise3D(x * noiseScale, y * noiseScale, time * currentParameters.energy * 0.1);
            const noiseY = noise3D(x * noiseScale + 100, y * noiseScale, time * currentParameters.energy * 0.1);
            const noiseZ = noise3D(x * noiseScale, y * noiseScale + 100, time * currentParameters.energy * 0.1);

            // Apply movement based on current movement type
            const movementSpeed = currentParameters.energy * 0.01;

            if (currentParameters.movement === 'falling') {
                positions[i3 + 1] -= movementSpeed;
            } else if (currentParameters.movement === 'rising') {
                positions[i3 + 1] += movementSpeed;
            } else if (currentParameters.movement === 'floating') {
                positions[i3] += noiseX * movementSpeed;
                positions[i3 + 1] += noiseY * movementSpeed;
                positions[i3 + 2] += noiseZ * movementSpeed * 0.5;
            } else if (currentParameters.movement === 'swirling') {
                const angle = Math.atan2(y, x) + movementSpeed * 2;
                const radius = Math.sqrt(x * x + y * y);
                positions[i3] = Math.cos(angle) * radius;
                positions[i3 + 1] = Math.sin(angle) * radius;
                positions[i3 + 2] += noiseZ * movementSpeed;
            } else if (currentParameters.movement === 'pulsing') {
                const pulse = Math.sin(time * 2 + i * 0.1) * movementSpeed;
                positions[i3] += pulse * Math.sign(x);
                positions[i3 + 1] += pulse * Math.sign(y);
            }

            // Boundary wrapping
            if (positions[i3] > 5) positions[i3] = -5;
            if (positions[i3] < -5) positions[i3] = 5;
            if (positions[i3 + 1] > 5) positions[i3 + 1] = -5;
            if (positions[i3 + 1] < -5) positions[i3 + 1] = 5;
            if (positions[i3 + 2] > 2.5) positions[i3 + 2] = -2.5;
            if (positions[i3 + 2] < -2.5) positions[i3 + 2] = 2.5;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particleCount}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05 * (1 - currentParameters.organicness + 0.5)}
                vertexColors
                transparent
                opacity={0.6 + currentParameters.glow * 0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

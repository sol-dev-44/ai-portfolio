
'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Float, Stars, Environment, Instance, Instances } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Styling {
    contrast: number;
    brightness: number;
    warmth: number;
    sharpness: number;
}

interface GenerativeVizProps {
    sentiment: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    palette: string[];
    style?: Styling; // Optional for backward compatibility if needed, but we'll pass it
}

function Particles({ count, speed, color }: { count: number, speed: number, color: string }) {
    const ref = useRef<any>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * speed * 0.1;
            ref.current.rotation.x += delta * speed * 0.05;
        }
    });

    return (
        <group ref={ref}>
            <Instances range={count}>
                <dodecahedronGeometry args={[0.05, 0]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} />
                {Array.from({ length: count }).map((_, i) => (
                    <Instance
                        key={i}
                        position={[
                            (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 10
                        ]}
                        scale={0.5 + Math.random()}
                    />
                ))}
            </Instances>
        </group>
    );
}

function Scene({ sentiment, palette, style }: GenerativeVizProps) {
    // defaults if style is missing (during transition)
    const s = style || { contrast: 0.5, brightness: 0.5, warmth: 0.5, sharpness: 0.5 };

    const distort = useMemo(() => 0.3 + (sentiment.arousal * 0.8), [sentiment.arousal]);
    const speed = useMemo(() => 1 + (sentiment.arousal * 5), [sentiment.arousal]);
    const color = useMemo(() => palette[0] || '#8b5cf6', [palette]);
    const secondaryColor = useMemo(() => palette[1] || '#ffffff', [palette]);

    // Particle count based on arousal (more energy = more particles)
    const particleCount = Math.floor(50 + (sentiment.arousal * 200));

    return (
        <>
            <ambientLight intensity={0.2 + (s.brightness * 0.5)} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color={s.warmth > 0.6 ? '#ffaa00' : '#ffffff'} />
            <Environment preset={sentiment.valence > 0 ? "sunset" : "city"} />

            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

            <Particles count={particleCount} speed={speed} color={secondaryColor} />

            <Float
                speed={speed * 0.5}
                rotationIntensity={sentiment.dominance * 2}
                floatIntensity={sentiment.dominance + 0.5}
            >
                <mesh scale={2.5}>
                    <sphereGeometry args={[1, 128, 128]} />
                    <MeshDistortMaterial
                        color={color}
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1 + (1 - s.sharpness) * 0.4}
                        metalness={0.1 + (s.contrast * 0.5)}
                        roughness={0.1}
                        distort={distort}
                        speed={speed}
                    />
                </mesh>
            </Float>

            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5 * (s.brightness + 0.2)} radius={0.4} />
                <Noise opacity={0.05 * s.sharpness} />
                <Vignette eskil={false} offset={0.1} darkness={1.1 - s.brightness} />
            </EffectComposer>
        </>
    );
}

export function GenerativeViz({ sentiment, palette, style }: GenerativeVizProps) {
    return (
        <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl relative group">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white/80 font-medium font-mono text-sm tracking-widest backdrop-blur-md px-2 py-1 rounded">
                    GENERATIVE // MOOD STATE 2.0
                </h3>
            </div>

            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: false }}>
                <Scene sentiment={sentiment} palette={palette} style={style} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
            </Canvas>
        </div>
    );
}

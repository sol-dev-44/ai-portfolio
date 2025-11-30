'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Robot3DProps {
    action: string;
    expression: string;
    speed: number;
}

export default function Robot3D({ action, expression, speed }: Robot3DProps) {
    const groupRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Mesh>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);

    const leftEyeRef = useRef<THREE.Mesh>(null);
    const rightEyeRef = useRef<THREE.Mesh>(null);
    const mouthRef = useRef<THREE.Mesh>(null);

    const animationStateRef = useRef({
        time: 0,
        walkCycle: 0,
        jumpHeight: 0,
        isJumping: false,
    });

    // Animation loop
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const animState = animationStateRef.current;
        animState.time += delta * speed;

        // Apply actions
        switch (action) {
            case 'wave':
                if (rightArmRef.current) {
                    rightArmRef.current.rotation.z = Math.sin(animState.time * 5) * 0.5 - 0.3;
                    rightArmRef.current.rotation.x = Math.sin(animState.time * 5) * 0.3;
                }
                break;

            case 'dance':
                if (groupRef.current) {
                    groupRef.current.rotation.y = Math.sin(animState.time * 2) * 0.3;
                }
                if (leftArmRef.current && rightArmRef.current) {
                    leftArmRef.current.rotation.z = Math.sin(animState.time * 4) * 0.5 + 0.3;
                    rightArmRef.current.rotation.z = Math.sin(animState.time * 4 + Math.PI) * 0.5 - 0.3;
                }
                if (bodyRef.current) {
                    bodyRef.current.position.y = Math.sin(animState.time * 4) * 0.1;
                }
                break;

            case 'walk':
                animState.walkCycle += delta * speed * 3;
                if (leftLegRef.current && rightLegRef.current) {
                    leftLegRef.current.rotation.x = Math.sin(animState.walkCycle) * 0.5;
                    rightLegRef.current.rotation.x = Math.sin(animState.walkCycle + Math.PI) * 0.5;
                }
                if (leftArmRef.current && rightArmRef.current) {
                    leftArmRef.current.rotation.x = Math.sin(animState.walkCycle + Math.PI) * 0.3;
                    rightArmRef.current.rotation.x = Math.sin(animState.walkCycle) * 0.3;
                }
                break;

            case 'jump':
                if (!animState.isJumping) {
                    animState.isJumping = true;
                    animState.jumpHeight = 0;
                }
                animState.jumpHeight += delta * 8;
                const jumpY = Math.max(0, Math.sin(animState.jumpHeight) * 2);
                if (groupRef.current) {
                    groupRef.current.position.y = jumpY;
                }
                if (animState.jumpHeight > Math.PI) {
                    animState.isJumping = false;
                    animState.jumpHeight = 0;
                }
                break;

            case 'idle':
            default:
                // Gentle breathing animation
                if (bodyRef.current) {
                    bodyRef.current.scale.y = 1 + Math.sin(animState.time * 2) * 0.02;
                }
                // Reset limbs to neutral
                if (leftArmRef.current && rightArmRef.current) {
                    leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.2, 0.1);
                    rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.2, 0.1);
                    leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
                    rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
                }
                if (leftLegRef.current && rightLegRef.current) {
                    leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
                    rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
                }
                break;
        }

        // Apply expressions
        applyExpression(expression);
    });

    const applyExpression = (expr: string) => {
        if (!leftEyeRef.current || !rightEyeRef.current || !mouthRef.current) return;

        const lerpSpeed = 0.15;

        switch (expr) {
            case 'happy':
                // Eyes: Slightly squinted (scale Z for height, not Y)
                leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1.1, lerpSpeed);
                leftEyeRef.current.scale.z = THREE.MathUtils.lerp(leftEyeRef.current.scale.z, 0.5, lerpSpeed);
                leftEyeRef.current.scale.y = 1; // Reset protrusion

                rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1.1, lerpSpeed);
                rightEyeRef.current.scale.z = THREE.MathUtils.lerp(rightEyeRef.current.scale.z, 0.5, lerpSpeed);
                rightEyeRef.current.scale.y = 1;

                // Mouth: Wide smile - scale wider
                mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1.8, lerpSpeed);
                mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1.2, lerpSpeed);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0, lerpSpeed);
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.22, lerpSpeed);
                break;

            case 'sad':
                // Eyes: Droopy (scale Z)
                leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 0.9, lerpSpeed);
                leftEyeRef.current.scale.z = THREE.MathUtils.lerp(leftEyeRef.current.scale.z, 0.6, lerpSpeed);
                leftEyeRef.current.scale.y = 1;

                rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 0.9, lerpSpeed);
                rightEyeRef.current.scale.z = THREE.MathUtils.lerp(rightEyeRef.current.scale.z, 0.6, lerpSpeed);
                rightEyeRef.current.scale.y = 1;

                // Mouth: Slightly narrower
                mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1.4, lerpSpeed);
                mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.8, lerpSpeed);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0, lerpSpeed);
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.28, lerpSpeed);
                break;

            case 'surprised':
                // Eyes: Very wide (scale Z)
                leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1.4, lerpSpeed);
                leftEyeRef.current.scale.z = THREE.MathUtils.lerp(leftEyeRef.current.scale.z, 1.4, lerpSpeed);
                leftEyeRef.current.scale.y = 1;

                rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1.4, lerpSpeed);
                rightEyeRef.current.scale.z = THREE.MathUtils.lerp(rightEyeRef.current.scale.z, 1.4, lerpSpeed);
                rightEyeRef.current.scale.y = 1;

                // Mouth: Open O-shape - tall and narrow
                mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 0.8, lerpSpeed);
                mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 3.0, lerpSpeed);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0, lerpSpeed);
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.3, lerpSpeed);
                break;

            case 'excited':
                // Eyes: Wide (scale Z)
                leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1.3, lerpSpeed);
                leftEyeRef.current.scale.z = THREE.MathUtils.lerp(leftEyeRef.current.scale.z, 1.3, lerpSpeed);
                leftEyeRef.current.scale.y = 1;

                rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1.3, lerpSpeed);
                rightEyeRef.current.scale.z = THREE.MathUtils.lerp(rightEyeRef.current.scale.z, 1.3, lerpSpeed);
                rightEyeRef.current.scale.y = 1;

                // Mouth: Very wide smile
                mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 2.2, lerpSpeed);
                mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1.5, lerpSpeed);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0, lerpSpeed);
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.2, lerpSpeed);
                break;

            case 'thinking':
                // Eyes: Squinted (scale Z)
                leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 0.8, lerpSpeed);
                leftEyeRef.current.scale.z = THREE.MathUtils.lerp(leftEyeRef.current.scale.z, 0.4, lerpSpeed);
                leftEyeRef.current.scale.y = 1;

                rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 0.8, lerpSpeed);
                rightEyeRef.current.scale.z = THREE.MathUtils.lerp(rightEyeRef.current.scale.z, 0.4, lerpSpeed);
                rightEyeRef.current.scale.y = 1;

                // Mouth: Small, pursed to the side
                mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 0.6, lerpSpeed);
                mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.8, lerpSpeed);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0.2, lerpSpeed); // Tilt
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.25, lerpSpeed);
                mouthRef.current.position.x = THREE.MathUtils.lerp(mouthRef.current.position.x, 0.05, lerpSpeed);

                // Head tilt
                if (headRef.current) {
                    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.15, lerpSpeed);
                }
                break;

            case 'neutral':
            default:
                // Reset everything to neutral
                leftEyeRef.current.scale.set(1, 1, 1);
                rightEyeRef.current.scale.set(1, 1, 1);

                mouthRef.current.scale.set(1, 1, 1);
                mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, 0, lerpSpeed);
                mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.25, lerpSpeed);
                mouthRef.current.position.x = THREE.MathUtils.lerp(mouthRef.current.position.x, 0, lerpSpeed);

                if (headRef.current) {
                    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, lerpSpeed);
                }
                break;
        }
    };

    // Materials - Classic Robot Colors
    const robotMaterial = new THREE.MeshStandardMaterial({
        color: '#d4af6a', // Vintage beige/gold
        metalness: 0.4,
        roughness: 0.6,
    });

    const darkAccentMaterial = new THREE.MeshStandardMaterial({
        color: '#8b7355', // Darker brown accent
        metalness: 0.3,
        roughness: 0.7,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: '#2c3e50', // Dark gray/blue for eyes
        metalness: 0.8,
        roughness: 0.2,
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
        color: '#ff6b6b',
        emissive: '#ff6b6b',
        emissiveIntensity: 0.6,
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Body - Boxy with panel details */}
            <mesh ref={bodyRef} position={[0, 0, 0]} material={robotMaterial} castShadow>
                <boxGeometry args={[1.4, 1.6, 1]} />
            </mesh>

            {/* Chest Panel */}
            <mesh position={[0, 0.1, 0.51]} material={darkAccentMaterial} castShadow>
                <boxGeometry args={[1.0, 0.6, 0.08]} />
            </mesh>

            {/* Chest Buttons (3 circles) */}
            <mesh position={[-0.25, 0.1, 0.56]} material={glowMaterial} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            </mesh>
            <mesh position={[0, 0.1, 0.56]} material={glowMaterial} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            </mesh>
            <mesh position={[0.25, 0.1, 0.56]} material={glowMaterial} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            </mesh>

            {/* Head - Boxy with rounded edges */}
            <group ref={headRef} position={[0, 1.3, 0]}>
                {/* Head Box */}
                <mesh material={robotMaterial} castShadow>
                    <boxGeometry args={[1.2, 1.0, 1.0]} />
                </mesh>

                {/* Head Top Panel */}
                <mesh position={[0, 0.5, 0]} material={darkAccentMaterial} castShadow>
                    <boxGeometry args={[1.0, 0.15, 0.8]} />
                </mesh>

                {/* Eyes - Circular recessed */}
                <group>
                    {/* Left Eye Recess */}
                    <mesh position={[-0.3, 0.05, 0.48]} material={darkAccentMaterial} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
                    </mesh>
                    {/* Left Eye */}
                    <mesh ref={leftEyeRef} position={[-0.3, 0.05, 0.52]} material={eyeMaterial} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
                    </mesh>

                    {/* Right Eye Recess */}
                    <mesh position={[0.3, 0.05, 0.48]} material={darkAccentMaterial} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
                    </mesh>
                    {/* Right Eye */}
                    <mesh ref={rightEyeRef} position={[0.3, 0.05, 0.52]} material={eyeMaterial} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
                    </mesh>
                </group>

                {/* Mouth - Rectangular panel */}
                <mesh position={[0, -0.25, 0.48]} material={darkAccentMaterial}>
                    <boxGeometry args={[0.6, 0.08, 0.1]} />
                </mesh>
                <mesh ref={mouthRef} position={[0, -0.25, 0.52]} material={eyeMaterial}>
                    <boxGeometry args={[0.5, 0.06, 0.05]} />
                </mesh>
            </group>

            {/* Antenna - Classic style */}
            <mesh position={[-0.3, 1.95, 0]} material={darkAccentMaterial} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            </mesh>
            <mesh position={[-0.3, 2.25, 0]} material={glowMaterial}>
                <sphereGeometry args={[0.1, 16, 16]} />
            </mesh>

            <mesh position={[0.3, 1.95, 0]} material={darkAccentMaterial} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            </mesh>
            <mesh position={[0.3, 2.25, 0]} material={glowMaterial}>
                <sphereGeometry args={[0.1, 16, 16]} />
            </mesh>

            {/* Left Arm - Segmented */}
            <group ref={leftArmRef} position={[-0.8, 0.5, 0]}>
                {/* Shoulder */}
                <mesh position={[0, 0, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.2, 16, 16]} />
                </mesh>
                {/* Upper Arm */}
                <mesh position={[0, -0.35, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.12, 0.12, 0.7, 8]} />
                </mesh>
                {/* Elbow */}
                <mesh position={[0, -0.7, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.15, 16, 16]} />
                </mesh>
                {/* Lower Arm */}
                <mesh position={[0, -1.0, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
                </mesh>
                {/* Hand - Claw style */}
                <mesh position={[0, -1.35, 0]} material={darkAccentMaterial} castShadow>
                    <boxGeometry args={[0.25, 0.15, 0.2]} />
                </mesh>
            </group>

            {/* Right Arm - Segmented */}
            <group ref={rightArmRef} position={[0.8, 0.5, 0]}>
                {/* Shoulder */}
                <mesh position={[0, 0, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.2, 16, 16]} />
                </mesh>
                {/* Upper Arm */}
                <mesh position={[0, -0.35, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.12, 0.12, 0.7, 8]} />
                </mesh>
                {/* Elbow */}
                <mesh position={[0, -0.7, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.15, 16, 16]} />
                </mesh>
                {/* Lower Arm */}
                <mesh position={[0, -1.0, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
                </mesh>
                {/* Hand - Claw style */}
                <mesh position={[0, -1.35, 0]} material={darkAccentMaterial} castShadow>
                    <boxGeometry args={[0.25, 0.15, 0.2]} />
                </mesh>
            </group>

            {/* Left Leg - Segmented */}
            <group ref={leftLegRef} position={[-0.4, -0.8, 0]}>
                {/* Hip */}
                <mesh position={[0, 0, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.18, 16, 16]} />
                </mesh>
                {/* Upper Leg */}
                <mesh position={[0, -0.45, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.15, 0.15, 0.9, 8]} />
                </mesh>
                {/* Knee */}
                <mesh position={[0, -0.9, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.16, 16, 16]} />
                </mesh>
                {/* Lower Leg */}
                <mesh position={[0, -1.25, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.13, 0.13, 0.7, 8]} />
                </mesh>
                {/* Foot - Boxy */}
                <mesh position={[0, -1.65, 0.15]} material={darkAccentMaterial} castShadow>
                    <boxGeometry args={[0.3, 0.15, 0.45]} />
                </mesh>
            </group>

            {/* Right Leg - Segmented */}
            <group ref={rightLegRef} position={[0.4, -0.8, 0]}>
                {/* Hip */}
                <mesh position={[0, 0, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.18, 16, 16]} />
                </mesh>
                {/* Upper Leg */}
                <mesh position={[0, -0.45, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.15, 0.15, 0.9, 8]} />
                </mesh>
                {/* Knee */}
                <mesh position={[0, -0.9, 0]} material={darkAccentMaterial} castShadow>
                    <sphereGeometry args={[0.16, 16, 16]} />
                </mesh>
                {/* Lower Leg */}
                <mesh position={[0, -1.25, 0]} material={robotMaterial} castShadow>
                    <cylinderGeometry args={[0.13, 0.13, 0.7, 8]} />
                </mesh>
                {/* Foot - Boxy */}
                <mesh position={[0, -1.65, 0.15]} material={darkAccentMaterial} castShadow>
                    <boxGeometry args={[0.3, 0.15, 0.45]} />
                </mesh>
            </group>
        </group>
    );
}

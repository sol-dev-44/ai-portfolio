'use client';

import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import Robot3D from './components/Robot3D';
import ControlPanel from './components/ControlPanel';
import SpeechControl from './components/SpeechControl';
import SpeedSlider from './components/SpeedSlider';
import { Loader2, Info } from 'lucide-react';

export default function RobotPage() {
    const [action, setAction] = useState('idle');
    const [expression, setExpression] = useState('neutral');
    const [speed, setSpeed] = useState(1);
    const [showInfo, setShowInfo] = useState(false);

    const handleCommandParsed = (newAction: string, newExpression: string, newSpeed?: number) => {
        setAction(newAction);
        setExpression(newExpression);
        if (newSpeed !== undefined) {
            setSpeed(newSpeed);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Interactive 3D Robot 🤖
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Control this friendly robot with manual toggles or use AI-powered voice commands!
                    </p>

                    {/* Info Toggle */}
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                    >
                        <Info className="w-4 h-4" />
                        {showInfo ? 'Hide' : 'Show'} Technical Details
                    </button>
                </motion.div>

                {/* Technical Info Panel */}
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 shadow-xl"
                    >
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    🎨 Three.js Rendering
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    The robot is built using <strong>procedural geometry</strong> - boxes, spheres, and cylinders composed in React Three Fiber.
                                    The scene uses <strong>PBR materials</strong> (Physically Based Rendering) with metalness and roughness properties for realistic lighting.
                                    <strong>Shadow mapping</strong> creates depth, and <strong>OrbitControls</strong> enable camera interaction.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    ⚡ Animation System
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Animations run at <strong>60 FPS</strong> using the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">useFrame</code> hook.
                                    Actions modify limb rotations via <strong>skeletal animation</strong>, while expressions use <strong>morph-like scaling</strong> on facial features.
                                    <strong>Linear interpolation (lerp)</strong> ensures smooth transitions between states.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    🎤 Web Speech API
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Voice input uses the browser's native <strong>SpeechRecognition API</strong> (Chrome/Edge only).
                                    Audio is processed <strong>locally on-device</strong> and transcribed to text in real-time.
                                    The transcription is then sent to our backend for AI parsing - no audio leaves your browser.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    🤖 AI Command Parsing
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Natural language commands are sent to <strong>OpenAI GPT-4o-mini</strong> with a structured prompt.
                                    The AI extracts <strong>action</strong>, <strong>expression</strong>, and <strong>speed</strong> parameters, returning JSON.
                                    This enables intuitive control like "dance quickly and happily" → <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{`{action: "dance", expression: "happy", speed: 1.8}`}</code>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-700 relative"
                            style={{ height: '600px' }}
                        >
                            <Canvas shadows>
                                <Suspense fallback={
                                    <mesh>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color="#4a90e2" />
                                    </mesh>
                                }>
                                    {/* Lighting */}
                                    <ambientLight intensity={0.5} />
                                    <directionalLight
                                        position={[10, 10, 5]}
                                        intensity={1}
                                        castShadow
                                        shadow-mapSize-width={2048}
                                        shadow-mapSize-height={2048}
                                    />
                                    <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4ecdc4" />
                                    <pointLight position={[10, -10, -5]} intensity={0.5} color="#ff6b6b" />

                                    {/* Camera */}
                                    <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />

                                    {/* Controls */}
                                    <OrbitControls
                                        enablePan={false}
                                        minDistance={5}
                                        maxDistance={15}
                                        minPolarAngle={Math.PI / 4}
                                        maxPolarAngle={Math.PI / 1.5}
                                    />

                                    {/* Environment */}
                                    <Environment preset="city" />

                                    {/* Robot */}
                                    <Robot3D action={action} expression={expression} speed={speed} />

                                    {/* Ground */}
                                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
                                        <planeGeometry args={[20, 20]} />
                                        <meshStandardMaterial color="#2d3748" metalness={0.1} roughness={0.8} />
                                    </mesh>
                                </Suspense>
                            </Canvas>
                        </motion.div>

                        {/* Controls under Canvas */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <SpeedSlider speed={speed} onSpeedChange={setSpeed} />

                            {/* Current State Display */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex gap-4 justify-center items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xl"
                            >
                                <div className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg">
                                    Action: {action}
                                </div>
                                <div className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-bold shadow-lg">
                                    Expression: {expression}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Control Panel - Takes 1 column on large screens */}
                    <div className="space-y-6">
                        <SpeechControl onCommandParsed={handleCommandParsed} />

                        <ControlPanel
                            action={action}
                            expression={expression}
                            onActionChange={setAction}
                            onExpressionChange={setExpression}
                        />
                    </div>
                </div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                    <p>💡 Tip: Use your mouse to rotate the camera around the robot!</p>
                </motion.div>
            </div>
        </div>
    );
}

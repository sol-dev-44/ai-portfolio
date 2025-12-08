'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    Cpu,
    Database,
    Globe,
    Eye,
    Calculator,
    BrainCircuit,
    Layers,
    User,
    FileText,
    RefreshCw,
    PenTool
} from 'lucide-react';

// Detailed Tooltip Data
const NODE_INFO = {
    user: {
        title: "User Client",
        tech: "React 19, Framer Motion, Streaming",
        desc: "The entry point. Handles image uploads (drag-n-drop), camera inputs, and tab navigation. Parses the NDJSON stream from the Orchestrator to render diagnosis steps in real-time."
    },
    trainer: {
        title: "Trainer UI (Manual Ingest)",
        tech: "React Form + URL Scraper",
        desc: "Allows the user to manually expand the Knowledge Base. Accepts raw text or URLs (scraped via backend). Inputs are chunked and embedded immediately."
    },
    orchestrator: {
        title: "Edge Orchestrator",
        tech: "Next.js API Route (Serverless)",
        desc: "The central controller. 1. Receives request. 2. Dispatches Vision analysis. 3. Spawns parallel sub-agents based on vision data. 4. Aggregates results. 5. Streams Synthesis. 6. Triggers Auto-Training."
    },
    db: {
        title: "Vector Database",
        tech: "Supabase (pgvector)",
        desc: "The Brain's Long-Term Memory. Stores repair guides, manual trainings, AND previous successful diagnoses. Isolated by 'app: snapfix' metadata."
    },
    vision: {
        title: "Vision Agent",
        tech: "GPT-4o Vision",
        desc: "Analyzes the image to determine Category, Symptoms, and Safety Risks. This structured output guides the other agents."
    },
    knowledge: {
        title: "Knowledge Agent (RAG)",
        tech: "OpenAI Embeddings + RPC",
        desc: "Searches the Vector DB for semantically similar repair problems. Retrieves both manual guides and past auto-learned diagnoses."
    },
    search: {
        title: "Search Agent",
        tech: "You.com / Tavily API",
        desc: "Fetches live data from the web: generic tutorials, part prices, and videos. Handles 403 errors and retries."
    },
    estimate: {
        title: "Estimation Agent",
        tech: "GPT-4o-mini",
        desc: "Calculates difficulty, time, and cost estimates based on the symptoms and category."
    },
    synthesis: {
        title: "Synthesis Engine",
        tech: "Claude 3.5 Sonnet",
        desc: "The Reasoning Core. Contextualizes all agent outputs into a unified, step-by-step repair guide. Ensures safety warnings are prominent."
    }
};

type NodeType = keyof typeof NODE_INFO;

export default function ArchitectureView() {
    const [activeNode, setActiveNode] = useState<NodeType | null>(null);

    const Node = ({ id, icon: Icon, label, color, x, y }: { id: NodeType, icon: any, label: string, color: string, x: number, y: number }) => (
        <motion.div
            className={`absolute p-3 rounded-xl border-2 cursor-pointer shadow-lg transition-colors z-20 bg-white dark:bg-gray-900 ${activeNode === id
                    ? `border-${color}-500 ring-4 ring-${color}-500/20 z-30 shadow-xl`
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`}
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', width: '140px' }}
            onClick={() => setActiveNode(id)}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 mx-auto bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs text-center">{label}</h3>
        </motion.div>
    );

    // SVG Connection Path Helper
    // Connects two points (percentages) with a bezier curve
    const Connection = ({ start, end, color = "gray", dashed = false, animate = false, label = "" }: { start: [number, number], end: [number, number], color?: string, dashed?: boolean, animate?: boolean, label?: string }) => {
        // Convert % to approximate pixels for a 800x600 canvas assumption inside the viewBox
        const sx = start[0] * 8;
        const sy = start[1] * 6;
        const ex = end[0] * 8;
        const ey = end[1] * 6;

        const c1x = sx;
        const c1y = sy + (ey - sy) / 2;
        const c2x = ex;
        const c2y = ey - (ey - sy) / 2;

        const path = `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;

        return (
            <g>
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={dashed ? "5,5" : "none"}
                    className={animate ? "animate-pulse" : ""}
                    opacity="0.4"
                />
                {animate && (
                    <circle r="4" fill={color}>
                        <animateMotion dur="2s" repeatCount="indefinite" path={path} />
                    </circle>
                )}
                {label && (
                    <text x={(sx + ex) / 2} y={(sy + ey) / 2} fill={color} fontSize="10" fontWeight="bold" textAnchor="middle" dy="-5" className="bg-white">
                        {label}
                    </text>
                )}
            </g>
        );
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 min-h-[700px]">
            {/* Interactive Diagram Area */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 relative overflow-hidden min-h-[600px] xl:min-h-auto shadow-inner">
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">

                    {/* Manual Ingest Loop */}
                    <Connection start={[15, 15]} end={[15, 50]} color="#10b981" dashed animate label="Manual Training" />

                    {/* Analysis Request */}
                    <Connection start={[50, 15]} end={[50, 30]} color="#3b82f6" animate />

                    {/* Orchestrator Dispatch */}
                    <Connection start={[50, 30]} end={[80, 20]} color="#8b5cf6" dashed />
                    <Connection start={[50, 30]} end={[80, 40]} color="#8b5cf6" dashed />
                    <Connection start={[50, 30]} end={[80, 60]} color="#8b5cf6" dashed />
                    <Connection start={[50, 30]} end={[80, 80]} color="#8b5cf6" dashed />

                    {/* RAG Retrieval Loop (Critical) */}
                    <Connection start={[15, 50]} end={[80, 40]} color="#f59e0b" dashed label="Retrieval" />

                    {/* Synthesis */}
                    <Connection start={[80, 20]} end={[50, 75]} color="#ec4899" />
                    <Connection start={[80, 40]} end={[50, 75]} color="#ec4899" />
                    <Connection start={[80, 60]} end={[50, 75]} color="#ec4899" />
                    <Connection start={[80, 80]} end={[50, 75]} color="#ec4899" />

                    {/* Auto-Training Loop (The Cyclical Part) */}
                    <path d="M 400 450 C 300 450 200 400 120 300" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse" />
                    <text x="250" y="420" fill="#10b981" fontSize="12" fontWeight="bold">Auto-Training Loop ↺</text>

                    {/* Response */}
                    <Connection start={[50, 75]} end={[50, 90]} color="#3b82f6" animate label="Response" />

                </svg>

                {/* Nodes Layout */}

                {/* Top: User Logic */}
                <Node id="trainer" icon={PenTool} label="Trainer Tab" color="green" x={15} y={15} />
                <Node id="user" icon={User} label="Analyzer Tab" color="blue" x={50} y={15} />

                {/* Middle: Controller & DB */}
                <Node id="orchestrator" icon={Layers} label="Orchestrator" color="purple" x={50} y={30} />
                <Node id="db" icon={Database} label="Vector DB (Mem)" color="green" x={15} y={50} />

                {/* Right: Agents Stack */}
                <Node id="vision" icon={Eye} label="Vision Agent" color="pink" x={80} y={20} />
                <Node id="knowledge" icon={BrainCircuit} label="Knowledge Agent" color="yellow" x={80} y={40} />
                <Node id="search" icon={Globe} label="Search Agent" color="cyan" x={80} y={60} />
                <Node id="estimate" icon={Calculator} label="Estimate Agent" color="orange" x={80} y={80} />

                {/* Bottom: Synthesis */}
                <Node id="synthesis" icon={Cpu} label="Claude Synthesis" color="indigo" x={50} y={75} />

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-gray-400">
                    <p>Live Streaming Response (NDJSON)</p>
                </div>
            </div>

            {/* Info Panel */}
            <div className="w-full xl:w-96 flex flex-col">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl sticky top-4">
                    {!activeNode ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-16 h-16 text-blue-100 dark:text-blue-900 mx-auto mb-6 animate-spin-slow" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interactive Architecture</h2>
                            <p className="text-gray-500">Click on any component node in the diagram loop to inspect its technology and function.</p>

                            <div className="mt-8 text-left bg-gray-50 dark:bg-black/20 p-4 rounded-lg text-sm space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span>User Request Flow</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span>Training Loops (Manual & Auto)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span>RAG Retrieval Context</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            key={activeNode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600`}>
                                    <Layers className="w-5 h-5" />
                                </span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    System Component
                                </span>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {NODE_INFO[activeNode].title}
                            </h2>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Technology Stack</p>
                                <p className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {NODE_INFO[activeNode].tech}
                                </p>
                            </div>

                            <div className="prose dark:prose-invert">
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    {NODE_INFO[activeNode].desc}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Server,
    Globe,
    ArrowRight,
    Zap,
    BookOpen,
    X,
    Sparkles,
    Scale,
    CloudSun,
    Search,
    Calculator,
    Clock,
    MessageSquare
} from 'lucide-react';
import AgentChat from '@/components/agent/AgentChat';

export default function AgentPage() {
    const [showLearnMore, setShowLearnMore] = useState(false);

    return (
        <main className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Tool-Calling Agent
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Compare{' '}
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Claude</span>
                        {' '}vs{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Open Source</span>
                        {' '}models with real tool execution
                    </p>
                </div>

                {/* Compact Flow Diagram */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm py-3 px-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded font-medium">You</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded font-medium">Claude</span>
                        <span className="text-gray-400">/</span>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded font-medium">Open Source</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded font-medium">Your App</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded font-medium">APIs</span>

                    <button
                        onClick={() => setShowLearnMore(true)}
                        className="ml-4 flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Learn more
                    </button>
                </div>

                {/* Chat Interface */}
                <AgentChat />

                {/* Learn More Modal */}
                <AnimatePresence>
                    {showLearnMore && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowLearnMore(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        How This Works
                                    </h2>
                                    <button
                                        onClick={() => setShowLearnMore(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)] space-y-6">

                                    {/* The Big Idea */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                            The Big Idea
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            LLMs are <strong>text generators</strong>, not action takers. They can't browse the web,
                                            call APIs, or run calculations. But they're excellent at <strong>deciding what to do</strong> and
                                            <strong>explaining results</strong>. This demo shows how to combine both: your app does the heavy
                                            lifting, the LLM provides the intelligence.
                                        </p>
                                    </div>

                                    {/* What the LLM Actually Does */}
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                            What the LLM Actually Does (Just 2 Things)
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">1. Choose Tools</span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Given a user's question, the LLM decides which tool(s) to call and with what parameters.
                                                    It outputs structured JSON like: <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">{"{"}"tool": "get_weather", "city": "Tokyo"{"}"}</code>
                                                </p>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">2. Synthesize Response</span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    After receiving tool results, the LLM crafts a natural language response.
                                                    It combines data from multiple sources, adds context, and presents it clearly to the user.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* What YOUR APP Does */}
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                            What Your App Does (The Heavy Lifting)
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                                                    <Server className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white">Parse Tool Requests</div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                        Extract the tool name and parameters from the LLM's JSON output
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                                                    <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white">Execute API Calls</div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                        Actually fetch data from external services (weather APIs, search engines, databases)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                                                    <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white">Run Computations</div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                        Perform calculations, data processing, or any logic that needs to be deterministic
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg mt-0.5">
                                                    <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white">Feed Results Back</div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                        Send tool outputs back to the LLM so it can generate the final response
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* The Loop Visualization */}
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">The Agent Loop</div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                            <div className="flex flex-col space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-bold text-blue-600">1</div>
                                                    <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                                                        <strong>User:</strong> "What's the weather in Tokyo?"
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-sm font-bold text-purple-600">2</div>
                                                    <div className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm">
                                                        <strong>LLM outputs:</strong> <code className="text-xs">{"{"}"tool": "get_weather", "city": "Tokyo"{"}"}</code>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-sm font-bold text-green-600">3</div>
                                                    <div className="flex-1 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm">
                                                        <strong>Your App:</strong> Calls Open-Meteo API → Gets 72°F, Sunny
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-sm font-bold text-purple-600">4</div>
                                                    <div className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm">
                                                        <strong>LLM synthesizes:</strong> "It's a beautiful day in Tokyo! Currently 72°F and sunny..."
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Insight */}
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="font-medium text-amber-800 dark:text-amber-200">Key Insight</div>
                                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                                    The LLM <strong>never</strong> touches the internet. It doesn't "call" APIs—it <em>asks</em> your
                                                    app to call them by outputting structured requests. Your app is the gatekeeper that
                                                    decides what's actually executed. This is how ChatGPT plugins, Claude MCP, and
                                                    function calling all work under the hood.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Why This Architecture */}
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Why This Architecture?</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">🔒 Security</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Your app controls what actions are possible. The LLM can only request tools you've defined.
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">✅ Reliability</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Calculations and API calls are deterministic. No LLM hallucination on factual data.
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">🔄 Flexibility</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Swap LLMs easily (Claude ↔ Open Source). The tool execution layer stays the same.
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">📊 Observability</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Log every tool call, monitor costs, debug issues. Full visibility into what's happening.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compare Feature */}
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">Compare Mode</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Run the <strong>same prompt</strong> through Claude and an open source model simultaneously.
                                                Watch how each decides which tools to use, how they interpret results differently,
                                                and compare their final responses side-by-side.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Available Tools */}
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tools in This Demo</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { name: 'Web Search', source: 'Google News + Wikipedia', icon: <Search className="w-4 h-4" />, desc: 'News and encyclopedia lookups' },
                                                { name: 'Weather', source: 'Open-Meteo API', icon: <CloudSun className="w-4 h-4" />, desc: 'Real-time weather data' },
                                                { name: 'Calculator', source: 'JS Math Engine', icon: <Calculator className="w-4 h-4" />, desc: 'Precise calculations' },
                                                { name: 'Time', source: 'Server Clock', icon: <Clock className="w-4 h-4" />, desc: 'Current date/time' },
                                            ].map((tool) => (
                                                <div key={tool.name} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-gray-500 dark:text-gray-400">{tool.icon}</div>
                                                        <div className="font-medium text-sm text-gray-900 dark:text-white">{tool.name}</div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{tool.desc}</div>
                                                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">→ {tool.source}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tech Stack */}
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tech Stack</div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                'Next.js API Routes',
                                                'Anthropic Claude API',
                                                'HuggingFace Inference',
                                                'Open-Meteo API',
                                                'RTK Query',
                                                'Framer Motion'
                                            ].map(tech => (
                                                <span key={tech} className="text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
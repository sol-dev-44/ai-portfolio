'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server,
    BookOpen,
    Plug,
    Cpu,
    Zap,
    ArrowRight,
    ArrowLeftRight,
    Github,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import AgentChat from '@/components/agent/AgentChat';

export default function AgentPage() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <main className="min-h-screen py-12 px-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
                        <Server size={14} />
                        <span>Model Context Protocol</span>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                            MCP Agent
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Tools exposed via <strong>Model Context Protocol</strong> — the open standard for
                        connecting AI to external systems. Used by Claude Desktop, Cursor, VS Code, and more.
                    </p>

                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                        <BookOpen size={16} />
                        {showGuide ? 'Hide Technical Guide' : 'How MCP Works'}
                    </button>
                </motion.div>

                {/* How It Works Panel */}
                <AnimatePresence>
                    {showGuide && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 border border-green-100 dark:border-green-900/30 shadow-xl overflow-hidden"
                        >
                            {/* What is MCP */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Plug className="w-5 h-5 text-green-600" />
                                    What is MCP?
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    <strong>Model Context Protocol (MCP)</strong> is an open standard created by Anthropic for connecting
                                    AI applications to external tools and data sources. Think of it like <strong>USB-C for AI</strong> —
                                    a universal connector that works with any compatible system.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                                        Used by Claude Desktop
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                                        Cursor IDE
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                                        VS Code
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                                        OpenAI Agents SDK
                                    </span>
                                </div>
                            </div>

                            {/* Architecture Diagram */}
                            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-center">Architecture</h4>
                                <div className="flex items-center justify-center gap-4 flex-wrap">
                                    {/* User/App */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <Cpu className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium mt-2">Claude</span>
                                        <span className="text-xs text-gray-500">(LLM)</span>
                                    </div>

                                    <ArrowLeftRight className="w-6 h-6 text-gray-400" />

                                    {/* MCP Client */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center border-2 border-dashed border-purple-300 dark:border-purple-700">
                                            <Plug className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-sm font-medium mt-2">MCP Client</span>
                                        <span className="text-xs text-gray-500">(This App)</span>
                                    </div>

                                    <ArrowLeftRight className="w-6 h-6 text-gray-400" />

                                    {/* MCP Server */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center border-2 border-green-300 dark:border-green-700">
                                            <Server className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-sm font-medium mt-2">MCP Server</span>
                                        <span className="text-xs text-gray-500">(Tool Provider)</span>
                                    </div>

                                    <ArrowRight className="w-6 h-6 text-gray-400" />

                                    {/* Tools */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                                            <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <span className="text-sm font-medium mt-2">External APIs</span>
                                        <span className="text-xs text-gray-500">(Weather, Search...)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Concepts */}
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Plug className="w-4 h-4 text-purple-600" />
                                        MCP Client
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Lives in the host application (this Next.js app). Discovers available tools
                                        from MCP servers and routes tool calls from the LLM.
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Server className="w-4 h-4 text-green-600" />
                                        MCP Server
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Exposes tools via the MCP protocol (JSON-RPC 2.0). Can be reused by ANY
                                        MCP client — Claude Desktop, Cursor, your apps, etc.
                                    </p>
                                </div>

                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-orange-600" />
                                        Tools
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Functions that the LLM can call. Defined with schemas (like OpenAPI) so
                                        the LLM knows how to use them.
                                    </p>
                                </div>
                            </div>

                            {/* What This Demo Implements */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl mb-6">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3">What This Demo Implements:</h4>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>MCP Server</strong> — TypeScript server using official <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">@modelcontextprotocol/sdk</code></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>MCP Client</strong> — Next.js API route that connects to the server via SSE transport</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>4 Tools</strong> — Weather (Open-Meteo), Search (DuckDuckGo), Calculator, Time</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>Tool Discovery</strong> — Client queries server for available tools dynamically</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>Reusable</strong> — The MCP server works with Claude Desktop, Cursor, etc.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Links */}
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href="https://www.anthropic.com/news/model-context-protocol"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Anthropic MCP Announcement
                                </a>
                                <a
                                    href="https://github.com/modelcontextprotocol/typescript-sdk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                                >
                                    <Github className="w-4 h-4" />
                                    TypeScript SDK
                                </a>
                                <a
                                    href="https://modelcontextprotocol.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    MCP Documentation
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <AgentChat />
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center pt-4"
                >
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Built with the official{' '}
                        <a
                            href="https://github.com/modelcontextprotocol/typescript-sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 dark:text-green-400 hover:underline"
                        >
                            MCP TypeScript SDK
                        </a>
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
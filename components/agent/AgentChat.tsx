'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    Send,
    Loader2,
    Search,
    CloudSun,
    Calculator,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Zap,
    Brain,
    Globe,
    Server,
    Cpu,
    MessageSquare,
    RefreshCw,
    Sparkles,
    Scale
} from 'lucide-react';
import {
    useGetAgentStatusQuery,
    useAgentChat,
    type AgentBackend,
    type OpenSourceModel
} from '@/store/api/agentApi';

// =============================================================================
// TYPES
// =============================================================================

interface ToolExecution {
    id: string;
    tool: string;
    args: Record<string, unknown>;
    result?: string;
    source?: string;
    source_url?: string;
    status: 'executing' | 'complete' | 'error';
    error?: string;
}

interface PipelineStep {
    id: string;
    actor: 'user' | 'app' | 'claude' | 'opensource' | 'api';
    action: string;
    detail: string;
    status: 'pending' | 'active' | 'complete';
    timestamp: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    backend?: AgentBackend;
    model?: string;
    toolExecutions?: ToolExecution[];
    pipelineSteps?: PipelineStep[];
    // For compare mode - stores both responses with full pipeline
    compareResults?: {
        claude: {
            content: string;
            toolExecutions: ToolExecution[];
            pipelineSteps: PipelineStep[];
            loading: boolean;
            error?: string
        };
        opensource: {
            content: string;
            toolExecutions: ToolExecution[];
            pipelineSteps: PipelineStep[];
            loading: boolean;
            error?: string
        };
    };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TOOL_META: Record<string, {
    icon: React.ReactNode;
    color: string;
    name: string;
    apiSource: string;
    apiUrl: string;
}> = {
    get_weather: {
        icon: <CloudSun className="w-4 h-4" />,
        color: 'cyan',
        name: 'Weather',
        apiSource: 'Open-Meteo API',
        apiUrl: 'https://open-meteo.com',
    },
    web_search: {
        icon: <Search className="w-4 h-4" />,
        color: 'green',
        name: 'Web Search',
        apiSource: 'Google News + Wikipedia',
        apiUrl: 'https://news.google.com',
    },
    calculate: {
        icon: <Calculator className="w-4 h-4" />,
        color: 'purple',
        name: 'Calculator',
        apiSource: 'Math Engine',
        apiUrl: '',
    },
    get_time: {
        icon: <Clock className="w-4 h-4" />,
        color: 'orange',
        name: 'Time',
        apiSource: 'Server Clock',
        apiUrl: '',
    },
};

const SUGGESTIONS = [
    { icon: <CloudSun className="w-4 h-4" />, text: "What's the weather in Tokyo?" },
    { icon: <Search className="w-4 h-4" />, text: "Search for latest AI news" },
    { icon: <Calculator className="w-4 h-4" />, text: "Calculate 18% tip on $94.50" },
    { icon: <Clock className="w-4 h-4" />, text: "What time is it?" },
];

const OPENSOURCE_MODELS: { key: OpenSourceModel; name: string; provider: string }[] = [
    { key: 'qwen', name: 'Qwen 2.5 72B', provider: 'Alibaba' },
    { key: 'llama', name: 'Llama 3.3 70B', provider: 'Meta' },
    { key: 'deepseek', name: 'DeepSeek R1', provider: 'DeepSeek' },
];

const ACTOR_COLORS = {
    user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    app: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    claude: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    opensource: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    api: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
};

const ACTOR_ICONS = {
    user: <MessageSquare className="w-3 h-3" />,
    app: <Server className="w-3 h-3" />,
    claude: <Brain className="w-3 h-3" />,
    opensource: <Sparkles className="w-3 h-3" />,
    api: <Globe className="w-3 h-3" />,
};

const ACTOR_LABELS = {
    user: 'You',
    app: 'Your App',
    claude: 'Claude',
    opensource: 'Open Source',
    api: 'External API',
};

// =============================================================================
// PIPELINE VISUALIZER
// =============================================================================

function PipelineVisualizer({ steps, isActive }: { steps: PipelineStep[]; isActive: boolean }) {
    if (steps.length === 0 && !isActive) return null;

    return (
        <div className="mb-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Execution Pipeline
                    </span>
                </div>
                {isActive && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {steps.map((step, idx) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-start gap-3 p-2 rounded-lg ${step.status === 'active' ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : ''
                            }`}
                    >
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${ACTOR_COLORS[step.actor]} flex-shrink-0`}>
                            {ACTOR_ICONS[step.actor]}
                            <span>{ACTOR_LABELS[step.actor]}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {step.action}
                                </span>
                                {step.status === 'active' && (
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                )}
                                {step.status === 'complete' && (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {step.detail}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {isActive && steps.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing pipeline...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// TOOL CARD
// =============================================================================

function ToolCard({ execution, isExpanded, onToggle }: {
    execution: ToolExecution;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const meta = TOOL_META[execution.tool] || {
        icon: <Zap className="w-4 h-4" />,
        color: 'gray',
        name: execution.tool,
        apiSource: 'Unknown',
        apiUrl: '',
    };

    const bgColors: Record<string, string> = {
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    };

    const iconColors: Record<string, string> = {
        cyan: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
        purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
        gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };

    return (
        <div className={`rounded-xl border-2 ${bgColors[meta.color]} overflow-hidden`}>
            <button
                onClick={onToggle}
                className="w-full p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconColors[meta.color]}`}>
                        {meta.icon}
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {meta.name}
                            </span>
                            {execution.status === 'executing' && (
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            )}
                            {execution.status === 'complete' && (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                            )}
                            {execution.status === 'error' && (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                        </div>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Source Attribution */}
            <div className="px-3 pb-3 -mt-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/40 rounded-md text-xs">
                    <Globe className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-orange-700 dark:text-orange-300">Data:</span>
                    {meta.apiUrl ? (
                        <a
                            href={meta.apiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                            {meta.apiSource}
                            <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    ) : (
                        <span className="text-orange-600 dark:text-orange-400">{meta.apiSource}</span>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                    <Brain className="w-3 h-3" />
                                    LLM Requested:
                                </div>
                                <pre className="text-xs bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg overflow-x-auto font-mono border border-purple-200 dark:border-purple-800">
                                    {JSON.stringify({ tool: execution.tool, args: execution.args }, null, 2)}
                                </pre>
                            </div>

                            {execution.result && (
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                                        <Server className="w-3 h-3" />
                                        Result:
                                    </div>
                                    <div className="text-sm bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                                            <ReactMarkdown>{execution.result}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {execution.error && (
                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                    <strong>Error:</strong> {execution.error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// COMPARE RESULT CARD - Full Pipeline View
// =============================================================================

function CompareResultCard({
    title,
    icon,
    color,
    content,
    toolExecutions,
    pipelineSteps,
    loading,
    error,
    expandedTools,
    onToggleTool
}: {
    title: string;
    icon: React.ReactNode;
    color: 'purple' | 'emerald';
    content: string;
    toolExecutions: ToolExecution[];
    pipelineSteps: PipelineStep[];
    loading: boolean;
    error?: string;
    expandedTools: Set<string>;
    onToggleTool: (id: string) => void;
}) {
    const bgColor = color === 'purple'
        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';

    const headerColor = color === 'purple'
        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';

    const accentColor = color === 'purple' ? 'purple' : 'emerald';

    return (
        <div className={`flex-1 rounded-xl border-2 ${bgColor} overflow-hidden`}>
            {/* Header */}
            <div className={`px-3 py-2 ${headerColor} flex items-center gap-2`}>
                {icon}
                <span className="font-bold text-sm">{title}</span>
                {loading && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                {!loading && content && <CheckCircle2 className="w-3 h-3 ml-auto text-green-500" />}
                {!loading && error && <AlertCircle className="w-3 h-3 ml-auto text-red-500" />}
            </div>

            <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                {error ? (
                    <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Pipeline Steps */}
                        {pipelineSteps.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <Cpu className="w-3 h-3" />
                                    <span>Pipeline</span>
                                    {loading && (
                                        <span className="ml-auto flex items-center gap-1 text-blue-500">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {pipelineSteps.slice(-4).map((step) => (
                                        <div
                                            key={step.id}
                                            className={`flex items-center gap-2 text-xs p-1.5 rounded ${step.status === 'active'
                                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                                : 'bg-gray-50 dark:bg-gray-800/50'
                                                }`}
                                        >
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${step.actor === 'claude' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' :
                                                step.actor === 'opensource' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' :
                                                    step.actor === 'api' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                {step.actor === 'claude' ? 'Claude' :
                                                    step.actor === 'opensource' ? 'LLM' :
                                                        step.actor === 'api' ? 'API' : 'App'}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                                                {step.action}
                                            </span>
                                            {step.status === 'active' && (
                                                <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
                                            )}
                                            {step.status === 'complete' && (
                                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tool Executions */}
                        {toolExecutions.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <Zap className="w-3 h-3" />
                                    <span>Tools Used</span>
                                </div>
                                {toolExecutions.map((exec) => {
                                    const meta = TOOL_META[exec.tool] || {
                                        icon: <Zap className="w-3 h-3" />,
                                        name: exec.tool,
                                        color: 'gray',
                                        apiSource: 'Unknown'
                                    };
                                    const isExpanded = expandedTools.has(exec.id);

                                    return (
                                        <div
                                            key={exec.id}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => onToggleTool(exec.id)}
                                                className="w-full px-2 py-1.5 flex items-center gap-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            >
                                                <span className={`p-1 rounded ${meta.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600' :
                                                    meta.color === 'green' ? 'bg-green-100 dark:bg-green-900/50 text-green-600' :
                                                        meta.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' :
                                                            meta.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600' :
                                                                'bg-gray-100 dark:bg-gray-700 text-gray-600'
                                                    }`}>
                                                    {meta.icon}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">{meta.name}</span>
                                                {exec.status === 'executing' && (
                                                    <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-auto" />
                                                )}
                                                {exec.status === 'complete' && (
                                                    <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                                                )}
                                                {isExpanded ? (
                                                    <ChevronUp className="w-3 h-3 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-gray-200 dark:border-gray-700"
                                                    >
                                                        <div className="p-2 space-y-2 text-xs">
                                                            <div>
                                                                <div className="text-gray-500 dark:text-gray-400 mb-1">Request:</div>
                                                                <pre className="bg-gray-50 dark:bg-gray-900 p-1.5 rounded text-[10px] overflow-x-auto">
                                                                    {JSON.stringify(exec.args, null, 2)}
                                                                </pre>
                                                            </div>
                                                            {exec.result && (
                                                                <div>
                                                                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                                                                        Result from {meta.apiSource}:
                                                                    </div>
                                                                    <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded text-[11px] prose prose-xs dark:prose-invert max-w-none">
                                                                        <ReactMarkdown>{exec.result.slice(0, 300)}{exec.result.length > 300 ? '...' : ''}</ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && !content && toolExecutions.length === 0 && pipelineSteps.length === 0 && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        )}

                        {/* Final Response */}
                        {content && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>Response</span>
                                </div>
                                <div className={`p-2 rounded-lg ${color === 'purple'
                                    ? 'bg-purple-50 dark:bg-purple-900/30'
                                    : 'bg-emerald-50 dark:bg-emerald-900/30'
                                    }`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
    const [backend, setBackend] = useState<AgentBackend>('claude');
    const [selectedModel, setSelectedModel] = useState<OpenSourceModel>('qwen');
    const [showModelPicker, setShowModelPicker] = useState(false);

    // RTK Query for status
    const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useGetAgentStatusQuery();

    // Streaming chat hook
    const { sendMessage } = useAgentChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastTextRef = useRef<string>('');

    const claudeAvailable = status?.claude?.available ?? false;
    const opensourceAvailable = status?.opensource?.available ?? false;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!isLoading) scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const toggleTool = (id: string) => {
        setExpandedTools(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const getModelDisplayName = () => {
        if (backend === 'claude') return 'Claude Sonnet 4';
        if (backend === 'compare') return 'Compare Mode';
        const model = OPENSOURCE_MODELS.find(m => m.key === selectedModel);
        return model ? model.name : 'Open Source';
    };

    const handleSuggestionClick = (text: string) => {
        setInput(text);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: input.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        lastTextRef.current = '';

        // COMPARE MODE - Run both backends in parallel
        if (backend === 'compare') {
            const assistantId = `msg-${Date.now() + 1}`;
            const opensourceModelName = OPENSOURCE_MODELS.find(m => m.key === selectedModel)?.name || 'Open Source';

            const assistantMsg: Message = {
                id: assistantId,
                role: 'assistant',
                content: '',
                backend: 'compare',
                model: 'Compare Mode',
                compareResults: {
                    claude: {
                        content: '',
                        toolExecutions: [],
                        pipelineSteps: [
                            {
                                id: `claude-step-1`,
                                actor: 'app',
                                action: 'Sending to Claude',
                                detail: 'POST /api/agent/chat',
                                status: 'active',
                                timestamp: Date.now()
                            }
                        ],
                        loading: true
                    },
                    opensource: {
                        content: '',
                        toolExecutions: [],
                        pipelineSteps: [
                            {
                                id: `os-step-1`,
                                actor: 'app',
                                action: `Sending to ${opensourceModelName}`,
                                detail: 'POST /api/agent/hf',
                                status: 'active',
                                timestamp: Date.now()
                            }
                        ],
                        loading: true
                    }
                }
            };

            setMessages(prev => [...prev, assistantMsg]);

            const updateCompareResult = (
                which: 'claude' | 'opensource',
                updater: (result: { content: string; toolExecutions: ToolExecution[]; pipelineSteps: PipelineStep[]; loading: boolean; error?: string }) => void
            ) => {
                setMessages(prev => {
                    const updated = [...prev];
                    const msg = updated.find(m => m.id === assistantId);
                    if (msg?.compareResults) {
                        updater(msg.compareResults[which]);
                    }
                    return [...updated];
                });
            };

            // Run Claude
            sendMessage(
                { message: userMsg.content },
                'claude' as AgentBackend,
                {
                    onToolCall: (id, tool, args) => {
                        updateCompareResult('claude', r => {
                            r.toolExecutions.push({ id, tool, args, status: 'executing' });
                            const toolMeta = TOOL_META[tool];
                            // Mark previous steps complete
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                            r.pipelineSteps.push({
                                id: `claude-tool-${Date.now()}`,
                                actor: 'claude',
                                action: `Calling ${toolMeta?.name || tool}`,
                                detail: JSON.stringify(args),
                                status: 'active',
                                timestamp: Date.now()
                            });
                        });
                    },
                    onToolResult: (id, tool, result) => {
                        updateCompareResult('claude', r => {
                            const t = r.toolExecutions.find(t => t.id === id);
                            if (t) { t.result = result; t.status = 'complete'; }
                            const toolMeta = TOOL_META[tool];
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                            r.pipelineSteps.push({
                                id: `claude-result-${Date.now()}`,
                                actor: 'api',
                                action: `${toolMeta?.name || tool} returned`,
                                detail: result.slice(0, 50) + '...',
                                status: 'complete',
                                timestamp: Date.now()
                            });
                        });
                    },
                    onText: (content) => {
                        updateCompareResult('claude', r => {
                            if (r.content.length === 0) {
                                r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                                r.pipelineSteps.push({
                                    id: `claude-gen-${Date.now()}`,
                                    actor: 'claude',
                                    action: 'Generating response',
                                    detail: 'Streaming...',
                                    status: 'active',
                                    timestamp: Date.now()
                                });
                            }
                            r.content += content;
                        });
                    },
                    onComplete: () => {
                        updateCompareResult('claude', r => {
                            r.loading = false;
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                        });
                        // Check if both done
                        setMessages(prev => {
                            const msg = prev.find(m => m.id === assistantId);
                            if (msg?.compareResults?.claude.loading === false && msg?.compareResults?.opensource.loading === false) {
                                setIsLoading(false);
                            }
                            return prev;
                        });
                    },
                    onError: (error) => {
                        updateCompareResult('claude', r => {
                            r.loading = false;
                            r.error = error;
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                        });
                    }
                }
            );

            // Run Open Source
            sendMessage(
                { message: userMsg.content, model: selectedModel },
                'opensource' as AgentBackend,
                {
                    onToolCall: (id, tool, args) => {
                        updateCompareResult('opensource', r => {
                            r.toolExecutions.push({ id, tool, args, status: 'executing' });
                            const toolMeta = TOOL_META[tool];
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                            r.pipelineSteps.push({
                                id: `os-tool-${Date.now()}`,
                                actor: 'opensource',
                                action: `Calling ${toolMeta?.name || tool}`,
                                detail: JSON.stringify(args),
                                status: 'active',
                                timestamp: Date.now()
                            });
                        });
                    },
                    onToolResult: (id, tool, result) => {
                        updateCompareResult('opensource', r => {
                            const t = r.toolExecutions.find(t => t.id === id);
                            if (t) { t.result = result; t.status = 'complete'; }
                            const toolMeta = TOOL_META[tool];
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                            r.pipelineSteps.push({
                                id: `os-result-${Date.now()}`,
                                actor: 'api',
                                action: `${toolMeta?.name || tool} returned`,
                                detail: result.slice(0, 50) + '...',
                                status: 'complete',
                                timestamp: Date.now()
                            });
                        });
                    },
                    onText: (content) => {
                        updateCompareResult('opensource', r => {
                            if (r.content.length === 0) {
                                r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                                r.pipelineSteps.push({
                                    id: `os-gen-${Date.now()}`,
                                    actor: 'opensource',
                                    action: 'Generating response',
                                    detail: 'Streaming...',
                                    status: 'active',
                                    timestamp: Date.now()
                                });
                            }
                            r.content += content;
                        });
                    },
                    onComplete: () => {
                        updateCompareResult('opensource', r => {
                            r.loading = false;
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                        });
                        // Check if both done
                        setMessages(prev => {
                            const msg = prev.find(m => m.id === assistantId);
                            if (msg?.compareResults?.claude.loading === false && msg?.compareResults?.opensource.loading === false) {
                                setIsLoading(false);
                            }
                            return prev;
                        });
                    },
                    onError: (error) => {
                        updateCompareResult('opensource', r => {
                            r.loading = false;
                            r.error = error;
                            r.pipelineSteps = r.pipelineSteps.map(s => ({ ...s, status: 'complete' as const }));
                        });
                    }
                }
            );

            // Set a timeout to finish loading state
            setTimeout(() => setIsLoading(false), 30000);
            return;
        }

        // SINGLE BACKEND MODE
        const assistantId = `msg-${Date.now() + 1}`;
        const llmActor = backend === 'claude' ? 'claude' : 'opensource';
        const modelName = getModelDisplayName();

        const assistantMsg: Message = {
            id: assistantId,
            role: 'assistant',
            content: '',
            backend,
            model: modelName,
            toolExecutions: [],
            pipelineSteps: [
                {
                    id: 'step-1',
                    actor: 'user',
                    action: 'Sent message',
                    detail: `"${input.trim().slice(0, 50)}${input.length > 50 ? '...' : ''}"`,
                    status: 'complete',
                    timestamp: Date.now()
                },
                {
                    id: 'step-2',
                    actor: 'app',
                    action: `Forwarding to ${modelName}`,
                    detail: backend === 'claude' ? 'POST /api/agent/chat' : 'POST /api/agent/hf',
                    status: 'active',
                    timestamp: Date.now()
                }
            ]
        };

        setMessages(prev => [...prev, assistantMsg]);

        const updateAssistant = (updater: (msg: Message) => void) => {
            setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated.find(m => m.id === assistantId);
                if (lastMsg) updater(lastMsg);
                return [...updated];
            });
        };

        await sendMessage(
            { message: userMsg.content, model: selectedModel },
            backend,
            {
                onToolCall: (id, tool, args) => {
                    updateAssistant(msg => {
                        if (msg.toolExecutions?.find(t => t.id === id)) return;

                        msg.toolExecutions = [
                            ...(msg.toolExecutions || []),
                            { id, tool, args, status: 'executing' }
                        ];

                        const toolMeta = TOOL_META[tool];
                        msg.pipelineSteps = [
                            ...(msg.pipelineSteps || []).map(s => ({ ...s, status: 'complete' as const })),
                            {
                                id: `step-${Date.now()}-1`,
                                actor: llmActor,
                                action: `Requested: ${toolMeta?.name || tool}`,
                                detail: JSON.stringify(args),
                                status: 'complete',
                                timestamp: Date.now()
                            },
                            {
                                id: `step-${Date.now()}-2`,
                                actor: 'app',
                                action: `Executing ${toolMeta?.name || tool}`,
                                detail: `Calling ${toolMeta?.apiSource || 'external service'}...`,
                                status: 'active',
                                timestamp: Date.now()
                            }
                        ];

                        setExpandedTools(prev => new Set([...prev, id]));
                    });
                },

                onToolResult: (id, tool, result, source, sourceUrl) => {
                    updateAssistant(msg => {
                        const toolExec = msg.toolExecutions?.find(t => t.id === id);
                        if (toolExec) {
                            toolExec.result = result;
                            toolExec.source = source;
                            toolExec.source_url = sourceUrl;
                            toolExec.status = 'complete';
                        }

                        const cleanResult = result
                            .replace(/\*\*/g, '')
                            .replace(/\*/g, '')
                            .replace(/#{1,6}\s/g, '')
                            .replace(/\n/g, ' ')
                            .trim()
                            .slice(0, 60);

                        msg.pipelineSteps = [
                            ...(msg.pipelineSteps || []).map(s => ({ ...s, status: 'complete' as const })),
                            {
                                id: `step-${Date.now()}`,
                                actor: 'api',
                                action: 'Returned data',
                                detail: cleanResult + (result.length > 60 ? '...' : ''),
                                status: 'complete',
                                timestamp: Date.now()
                            },
                            {
                                id: `step-${Date.now()}-2`,
                                actor: 'app',
                                action: `Sent result to ${modelName}`,
                                detail: 'LLM will now formulate response',
                                status: 'active',
                                timestamp: Date.now()
                            }
                        ];
                    });
                },

                onText: (content) => {
                    updateAssistant(msg => {
                        if (content && !msg.content.endsWith(content) && content !== lastTextRef.current) {
                            if (msg.content.length === 0) {
                                msg.pipelineSteps = [
                                    ...(msg.pipelineSteps || []).map(s => ({ ...s, status: 'complete' as const })),
                                    {
                                        id: `step-${Date.now()}`,
                                        actor: llmActor,
                                        action: 'Generating response',
                                        detail: 'Synthesizing answer...',
                                        status: 'active',
                                        timestamp: Date.now()
                                    }
                                ];
                            }
                            msg.content += content;
                            lastTextRef.current = content;
                        }
                    });
                },

                onComplete: () => {
                    updateAssistant(msg => {
                        msg.toolExecutions?.forEach(t => {
                            if (t.status === 'executing') t.status = 'complete';
                        });
                        msg.pipelineSteps = msg.pipelineSteps?.map(s => ({ ...s, status: 'complete' as const }));
                    });
                    setIsLoading(false);
                    lastTextRef.current = '';
                    setTimeout(scrollToBottom, 100);
                },

                onError: (error) => {
                    updateAssistant(msg => {
                        msg.content = `Error: ${error}`;
                        msg.toolExecutions?.forEach(t => {
                            if (t.status === 'executing') {
                                t.status = 'error';
                                t.error = error;
                            }
                        });
                    });
                    setIsLoading(false);
                    lastTextRef.current = '';
                }
            }
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">AI Agent</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Compare Claude vs Open Source models
                            </p>
                        </div>
                    </div>

                    {/* Backend Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetchStatus()}
                            disabled={statusLoading}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Refresh status"
                        >
                            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Three-way Toggle */}
                        <div className="relative bg-white dark:bg-gray-800 rounded-full p-1 shadow-inner border border-gray-200 dark:border-gray-700">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setBackend('claude')}
                                    disabled={isLoading || !claudeAvailable}
                                    className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${backend === 'claude'
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Brain className="w-3 h-3" />
                                        <span>Claude</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setBackend('compare')}
                                    disabled={isLoading || !claudeAvailable || !opensourceAvailable}
                                    className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${backend === 'compare'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                    title="Run both and compare"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Scale className="w-3 h-3" />
                                        <span>Compare</span>
                                    </div>
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setBackend('opensource');
                                            setShowModelPicker(!showModelPicker && backend === 'opensource');
                                        }}
                                        disabled={isLoading || !opensourceAvailable}
                                        className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${backend === 'opensource'
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Open Source</span>
                                            {backend === 'opensource' && (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Model Picker Dropdown */}
                                    <AnimatePresence>
                                        {showModelPicker && backend === 'opensource' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                            >
                                                {OPENSOURCE_MODELS.map(model => (
                                                    <button
                                                        key={model.key}
                                                        onClick={() => {
                                                            setSelectedModel(model.key);
                                                            setShowModelPicker(false);
                                                        }}
                                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${selectedModel === model.key ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''
                                                            }`}
                                                    >
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {model.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {model.provider}
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Model Badge */}
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Using:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${backend === 'claude'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : backend === 'compare'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        }`}>
                        {backend === 'compare' ? 'Claude + ' + (OPENSOURCE_MODELS.find(m => m.key === selectedModel)?.name || 'Open Source') : getModelDisplayName()}
                    </span>
                    {backend === 'opensource' && (
                        <span className="text-xs text-gray-400">via HuggingFace</span>
                    )}
                    {backend === 'compare' && (
                        <span className="text-xs text-gray-400">side-by-side</span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            AI Agent Demo
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-4">
                            Compare <span className="text-purple-600 font-medium">Claude</span> vs{' '}
                            <span className="text-emerald-600 font-medium">Open Source</span> models with tool-calling!
                        </p>

                        {/* Tools */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Available tools:</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {Object.entries(TOOL_META).map(([key, meta]) => (
                                <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                                    {meta.icon}
                                    <span>{meta.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[95%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                                {msg.role === 'user' ? (
                                    <div className="flex items-start gap-2">
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
                                            <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                ) : msg.backend === 'compare' && msg.compareResults ? (
                                    // COMPARE MODE DISPLAY
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Scale className="w-4 h-4" />
                                            <span className="font-medium">Side-by-side comparison</span>
                                            {(msg.compareResults.claude.loading || msg.compareResults.opensource.loading) && (
                                                <span className="ml-auto flex items-center gap-1.5 text-blue-500">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                    Running...
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <CompareResultCard
                                                title="Claude Sonnet 4"
                                                icon={<Brain className="w-4 h-4" />}
                                                color="purple"
                                                content={msg.compareResults.claude.content}
                                                toolExecutions={msg.compareResults.claude.toolExecutions}
                                                pipelineSteps={msg.compareResults.claude.pipelineSteps}
                                                loading={msg.compareResults.claude.loading}
                                                error={msg.compareResults.claude.error}
                                                expandedTools={expandedTools}
                                                onToggleTool={toggleTool}
                                            />
                                            <CompareResultCard
                                                title={OPENSOURCE_MODELS.find(m => m.key === selectedModel)?.name || 'Open Source'}
                                                icon={<Sparkles className="w-4 h-4" />}
                                                color="emerald"
                                                content={msg.compareResults.opensource.content}
                                                toolExecutions={msg.compareResults.opensource.toolExecutions}
                                                pipelineSteps={msg.compareResults.opensource.pipelineSteps}
                                                loading={msg.compareResults.opensource.loading}
                                                error={msg.compareResults.opensource.error}
                                                expandedTools={expandedTools}
                                                onToggleTool={toggleTool}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // SINGLE BACKEND DISPLAY
                                    <div className="space-y-3">
                                        <PipelineVisualizer
                                            steps={msg.pipelineSteps || []}
                                            isActive={isLoading && msg.id === messages[messages.length - 1]?.id}
                                        />

                                        {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                                            <div className="space-y-3">
                                                {msg.toolExecutions.map((exec) => (
                                                    <ToolCard
                                                        key={exec.id}
                                                        execution={exec}
                                                        isExpanded={expandedTools.has(exec.id)}
                                                        onToggle={() => toggleTool(exec.id)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {msg.content && (
                                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                    {msg.backend === 'opensource' ? (
                                                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    ) : (
                                                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    )}
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {msg.model || 'AI'}
                                                    </span>
                                                    {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                                                        <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                            {msg.toolExecutions.length} tool{msg.toolExecutions.length > 1 ? 's' : ''} used
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}

                                        {!msg.content && !msg.toolExecutions?.length && !msg.pipelineSteps?.length && isLoading && (
                                            <div className="flex items-center gap-2 text-gray-500 px-4 py-3">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Initializing...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* PERSISTENT SUGGESTIONS */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick prompts:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSuggestionClick(s.text)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 transition-all"
                        >
                            {s.icon}
                            <span>{s.text}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={backend === 'compare' ? "Ask something to compare both models..." : "Ask me anything..."}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <motion.button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-3 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${backend === 'claude'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                            : backend === 'compare'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                            }`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </motion.button>
                </form>
            </div>
        </div>
    );
}
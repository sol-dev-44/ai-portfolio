// lib/api/agentApi.ts
// RTK Query API for AI Agent - supports Claude (cloud) and Open Source (HuggingFace)

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// =============================================================================
// CONFIGURATION
// =============================================================================

// All endpoints are Next.js API routes (same origin)
const API_BASE_URL = '/api';

// Backend types
export type AgentBackend = 'claude' | 'opensource' | 'compare';

// Open Source model options (via HuggingFace)
export type OpenSourceModel = 'qwen' | 'llama' | 'deepseek';

// =============================================================================
// TYPES
// =============================================================================

export interface ToolMetadata {
    display_name: string;
    source: string;
    source_url: string;
}

export interface ToolSchema {
    name: string;
    description: string;
    source?: string;
    metadata?: ToolMetadata;
}

export interface BackendStatus {
    available: boolean;
    model: string;
    message?: string;
}

export interface OpenSourceModelInfo {
    key: string;
    id: string;
}

export interface AgentStatusResponse {
    status: string;
    claude: BackendStatus;
    opensource: BackendStatus & {
        models?: OpenSourceModelInfo[];
        default_model?: string;
    };
}

export interface AgentChatRequest {
    message: string;
    model?: OpenSourceModel; // Only used for opensource backend
    max_tokens?: number;
    temperature?: number;
}

export interface AgentEvent {
    type: 'text' | 'tool_call' | 'tool_result' | 'complete' | 'error';
    id?: string;
    content?: string;
    tool?: string;
    args?: Record<string, unknown>;
    result?: string;
    metadata?: ToolMetadata;
    source?: string;
    source_url?: string;
}

// =============================================================================
// RTK QUERY API
// =============================================================================

export const agentApi = createApi({
    reducerPath: 'agentApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
    tagTypes: ['AgentStatus'],
    endpoints: (builder) => ({
        // GET /api/agent/status - Check both backends
        getAgentStatus: builder.query<AgentStatusResponse, void>({
            query: () => '/agent/status',
            providesTags: ['AgentStatus'],
        }),

        // GET /api/agent/chat - Get Claude tools info
        getClaudeTools: builder.query<{ tools: ToolSchema[] }, void>({
            query: () => '/agent/chat',
        }),

        // GET /api/agent/hf - Get Open Source tools info
        getOpenSourceInfo: builder.query<{
            status: string;
            tools: ToolSchema[];
            models: OpenSourceModelInfo[];
            default_model: string;
        }, void>({
            query: () => '/agent/hf',
        }),
    }),
});

export const {
    useGetAgentStatusQuery,
    useGetClaudeToolsQuery,
    useGetOpenSourceInfoQuery,
} = agentApi;

// =============================================================================
// STREAMING CHAT HOOK
// =============================================================================

export interface StreamCallbacks {
    onText?: (content: string) => void;
    onToolCall?: (id: string, tool: string, args: Record<string, unknown>) => void;
    onToolResult?: (id: string, tool: string, result: string, source?: string, sourceUrl?: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
}

/**
 * Custom hook for streaming agent chat.
 * Supports both Claude and Open Source (HuggingFace) backends.
 */
export function useAgentChat() {
    const sendMessage = async (
        request: AgentChatRequest,
        backend: AgentBackend,
        callbacks: StreamCallbacks
    ) => {
        const { onText, onToolCall, onToolResult, onComplete, onError } = callbacks;

        // Select endpoint based on backend - both are Next.js API routes
        const endpoint = backend === 'claude'
            ? `${API_BASE_URL}/agent/chat`
            : `${API_BASE_URL}/agent/hf`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ content: 'Request failed' }));
                throw new Error(errorData.error || errorData.content || `HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete lines (NDJSON)
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const event: AgentEvent = JSON.parse(line);

                        switch (event.type) {
                            case 'text':
                                if (event.content && onText) {
                                    onText(event.content);
                                }
                                break;

                            case 'tool_call':
                                if (event.tool && onToolCall) {
                                    onToolCall(
                                        event.id || `tool-${Date.now()}`,
                                        event.tool,
                                        event.args || {}
                                    );
                                }
                                break;

                            case 'tool_result':
                                if (event.result && onToolResult) {
                                    onToolResult(
                                        event.id || `tool-${Date.now()}`,
                                        event.tool || 'unknown',
                                        event.result,
                                        event.source,
                                        event.source_url
                                    );
                                }
                                break;

                            case 'complete':
                                onComplete?.();
                                break;

                            case 'error':
                                onError?.(event.content || 'Unknown error');
                                break;
                        }
                    } catch (e) {
                        console.error('Failed to parse event:', line, e);
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                try {
                    const event: AgentEvent = JSON.parse(buffer);
                    if (event.type === 'complete') {
                        onComplete?.();
                    }
                } catch {
                    // Ignore incomplete final chunk
                }
            }

        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return { sendMessage };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get the best available backend.
 * Prefers Claude if available, falls back to Open Source.
 */
export function usePreferredBackend(): {
    backend: AgentBackend;
    isLoading: boolean;
    claudeAvailable: boolean;
    opensourceAvailable: boolean;
} {
    const { data, isLoading } = useGetAgentStatusQuery();

    const claudeAvailable = data?.claude?.available ?? false;
    const opensourceAvailable = data?.opensource?.available ?? false;

    // Prefer Claude, but use Open Source if Claude unavailable
    const backend: AgentBackend = claudeAvailable ? 'claude' : 'opensource';

    return {
        backend,
        isLoading,
        claudeAvailable,
        opensourceAvailable,
    };
}
// store/api/snapfixApi.ts
// RTK Query API slice for SnapFix

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// =============================================================================
// TYPES
// =============================================================================

export interface DiagnosisResponse {
    diagnosis: string;
    confidence: 'high' | 'medium' | 'low';
    category: string;
    cause: string;
    fix_steps: string[];
    difficulty: 'easy' | 'moderate' | 'hard' | 'call_a_pro';
    estimated_time: string;
    estimated_cost: string;
    tools_needed: string[];
    parts_needed: string[];
    warnings: string[];
    resources: { title: string; url: string }[];
}

export interface DiagnosisProgress {
    stage: string;
    status: 'analyzing' | 'running' | 'generating' | 'complete';
}

export interface DiagnosisEvent {
    type: 'progress' | 'vision_result' | 'text' | 'complete' | 'error';
    stage?: string;
    status?: string;
    data?: any;
    content?: string;
    diagnosis?: DiagnosisResponse;
    metadata?: any;
    error?: string;
    details?: string;
}

// =============================================================================
// RTK QUERY API
// =============================================================================

export const snapfixApi = createApi({
    reducerPath: 'snapfixApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    tagTypes: ['Diagnosis'],
    endpoints: (builder) => ({
        // Health check endpoints
        checkVisionHealth: builder.query<any, void>({
            query: () => '/snapfix/analyze',
        }),
        checkKnowledgeHealth: builder.query<any, void>({
            query: () => '/snapfix/knowledge',
        }),
        checkSearchHealth: builder.query<any, void>({
            query: () => '/snapfix/search',
        }),
        checkEstimateHealth: builder.query<any, void>({
            query: () => '/snapfix/estimate',
        }),
        checkOrchestratorHealth: builder.query<any, void>({
            query: () => '/snapfix',
        }),
    }),
});

export const {
    useCheckVisionHealthQuery,
    useCheckKnowledgeHealthQuery,
    useCheckSearchHealthQuery,
    useCheckEstimateHealthQuery,
    useCheckOrchestratorHealthQuery,
} = snapfixApi;

// =============================================================================
// STREAMING DIAGNOSIS HOOK
// =============================================================================

export interface StreamCallbacks {
    onProgress?: (stage: string, status: string) => void;
    onVisionResult?: (analysis: any) => void;
    onText?: (content: string) => void;
    onComplete?: (diagnosis: DiagnosisResponse, metadata: any) => void;
    onError?: (error: string) => void;
}

/**
 * Custom hook for streaming SnapFix diagnosis.
 * Handles image upload and real-time progress updates via NDJSON streaming.
 */
export function useSnapFixDiagnosis() {
    const diagnose = async (
        image: File,
        userPrompt: string | null,
        callbacks: StreamCallbacks
    ) => {
        const { onProgress, onVisionResult, onText, onComplete, onError } = callbacks;

        try {
            // Build FormData
            const formData = new FormData();
            formData.append('image', image);
            if (userPrompt) {
                formData.append('prompt', userPrompt);
            }

            // Call orchestrator endpoint
            const response = await fetch('/api/snapfix', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Stream NDJSON responses
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

                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const event: DiagnosisEvent = JSON.parse(line);

                        switch (event.type) {
                            case 'progress':
                                if (event.stage && event.status && onProgress) {
                                    onProgress(event.stage, event.status);
                                }
                                break;

                            case 'vision_result':
                                if (event.data && onVisionResult) {
                                    onVisionResult(event.data);
                                }
                                break;

                            case 'text':
                                if (event.content && onText) {
                                    onText(event.content);
                                }
                                break;

                            case 'complete':
                                if (event.diagnosis && onComplete) {
                                    onComplete(event.diagnosis, event.metadata || {});
                                }
                                break;

                            case 'error':
                                if (onError) {
                                    onError(event.error || event.details || 'Unknown error');
                                }
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
                    const event: DiagnosisEvent = JSON.parse(buffer);
                    if (event.type === 'complete' && event.diagnosis && onComplete) {
                        onComplete(event.diagnosis, event.metadata || {});
                    }
                } catch {
                    // Ignore incomplete final chunk
                }
            }

        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return { diagnose };
}

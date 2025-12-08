import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface ReasoningProblem {
    id: string;
    title: string;
    problem_text: string;
    category: string;
    difficulty: string;
    ground_truth_answer?: string;
}

interface ReasoningTrace {
    id?: string;
    session_id: string;
    trace_index: number;
    round_number?: number;
    reasoning_text: string;
    final_answer: string;
    score?: number;
    is_golden?: boolean;
    model_used: string;
    tokens_used?: number;
    latency_ms?: number;
    votes?: number;
}

interface ReasoningSession {
    id: string;
    problem_id?: string;
    user_query?: string;
    strategy: string;
    status: string;
    created_at: string;
    completed_at?: string;
}

interface STaRRound {
    round_number: number;
    num_traces: number;
    avg_score: number;
    improvement_pct?: number;
    golden_trace_ids: string[];
    traces?: ReasoningTrace[];
}

interface RunReasoningRequest {
    problem_id?: string;
    custom_question?: string;
    strategy: 'zero_shot_cot' | 'self_consistency';
    model?: string;
    n_traces?: number;
}

interface RunSTaRRequest {
    problem_id?: string;
    custom_question?: string;
    num_rounds?: number;
    traces_per_round?: number;
    model?: string;
}

interface ReasoningResponse {
    session_id: string;
    strategy: string;
    status: string;
    traces: ReasoningTrace[];
}

interface STaRResponse {
    session_id: string;
    rounds: STaRRound[];
    total_improvement_pct: number;
}

interface SessionResponse {
    session: ReasoningSession;
    traces: ReasoningTrace[];
    rounds?: STaRRound[];
}

export const reasoningApi = createApi({
    reducerPath: 'reasoningApi',
    baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api/reasoning` }),
    tagTypes: ['ReasoningSession', 'Problems'],
    endpoints: (builder) => ({
        // Get available problems
        getProblems: builder.query<{ problems: ReasoningProblem[] }, void>({
            query: () => '/problems',
            providesTags: ['Problems'],
        }),

        // Run a reasoning strategy
        runReasoning: builder.mutation<ReasoningResponse, RunReasoningRequest>({
            query: (body) => ({
                url: '/run',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ReasoningSession'],
        }),

        // Run STaR simulation
        runSTaR: builder.mutation<STaRResponse, RunSTaRRequest>({
            query: (body) => ({
                url: '/star',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ReasoningSession'],
        }),

        // Get session details
        getSession: builder.query<SessionResponse, string>({
            query: (sessionId) => `/session/${sessionId}`,
            providesTags: (result, error, sessionId) => [
                { type: 'ReasoningSession', id: sessionId },
            ],
        }),
    }),
});

export const {
    useGetProblemsQuery,
    useRunReasoningMutation,
    useRunSTaRMutation,
    useGetSessionQuery,
} = reasoningApi;

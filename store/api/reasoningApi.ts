import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ReasoningProblem {
    id: string;
    title: string;
    problem: string;
    category: string;
    difficulty: string;
    expected_answer?: string;
}

interface TraceTokens {
    input: number;
    output: number;
}

interface ReasoningTrace {
    reasoning: string;
    answer: string;
    tokens: TraceTokens;
}

interface RunReasoningRequest {
    problem_id?: string;
    custom_question?: string;
    problem?: string;
    strategy: 'zero_shot_cot' | 'self_consistency' | 'few_shot_cot';
    n_traces?: number;
    model?: string;
    expected_answer?: string;
}

interface RunSTaRRequest {
    problem_id?: string;
    custom_question?: string;
    problem?: string;
    num_rounds?: number;
    rounds?: number;
    traces_per_round?: number;
    model?: string;
}

interface ReasoningResponse {
    session_id: string;
    strategy: string;
    reasoning: string;
    answer?: string;
    finalAnswer?: string;
    tokens?: TraceTokens;
    traces?: ReasoningTrace[];
    agreement?: number;
    cost_estimate: number;
    total_tokens: number;
}

interface STaRRoundTrace {
    reasoning: string;
    score: number;
}

interface STaRRound {
    round: number;
    traces: STaRRoundTrace[];
    golden_count: number;
    avg_score: number;
    best_score: number;
}

interface STaRResponse {
    rounds: STaRRound[];
    total_rounds: number;
    improvement: number;
}

interface SessionResponse {
    id: string;
    problem_id: string;
    problem: string;
    strategy: string;
    reasoning: string;
    answer: string;
    expected_answer?: string;
    total_tokens: number;
    cost_estimate: number;
    created_at: string;
}

export const reasoningApi = createApi({
    reducerPath: 'reasoningApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/reasoning' }),
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

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const contractApi = createApi({
    reducerPath: 'contractApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/contract' }),
    endpoints: (builder) => ({
        analyzeContract: builder.mutation<any, { text: string; use_cache?: boolean; use_rag?: boolean }>({
            query: (body) => ({
                url: '/analyze',
                method: 'POST',
                body,
            }),
        }),
        rewriteClause: builder.mutation<{ rewritten_text: string }, { clause_text: string; risk_type: string; context?: string }>({
            query: (body) => ({
                url: '/rewrite',
                method: 'POST',
                body,
            }),
        }),
        submitFeedback: builder.mutation<any, { contract_text: string; analysis: any; user_feedback: string }>({
            query: (body) => ({
                url: '/feedback',
                method: 'POST',
                body,
            }),
        }),
        getContractStats: builder.query<{ risk_definitions: number; analyzed_contracts: number; total_documents: number }, void>({
            query: () => '/stats',
        }),
    }),
});

export const {
    useAnalyzeContractMutation,
    useRewriteClauseMutation,
    useSubmitFeedbackMutation,
    useGetContractStatsQuery
} = contractApi;

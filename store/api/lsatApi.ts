import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface LSATQuestion {
    id: string;
    context: string;
    question: string;
    options: string[];
    answer: string | number;
    dataset: string;
}

export interface LSATAnalysisRequest {
    question_data: LSATQuestion;
}

export interface LSATAnalysisResponse {
    system_prompt: string;
    user_prompt: string;
}

export const lsatApi = createApi({
    reducerPath: 'lsatApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/lsat' }),
    endpoints: (builder) => ({
        getQuestions: builder.mutation<{ questions: LSATQuestion[] }, { dataset: string; count: number }>({
            query: (body) => ({
                url: 'questions',
                method: 'POST',
                body,
            }),
        }),
        analyzeQuestion: builder.mutation<LSATAnalysisResponse, LSATAnalysisRequest>({
            query: (body) => ({
                url: 'analyze',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useGetQuestionsMutation, useAnalyzeQuestionMutation } = lsatApi;

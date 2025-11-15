import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// TypeScript types matching backend models
export interface LLMModelInfo {
  id: string;
  name: string;
  description: string;
  parameters: string;
}

export interface LLMGenerateRequest {
  prompt: string;
  model_id: 'gpt2' | 'qwen';
  strategy: 'greedy' | 'top_k' | 'top_p' | 'beam';
  max_new_tokens: number;
  temperature: number;
  top_k?: number;
  top_p?: number;
  num_beams?: number;
}

export interface LLMGenerateResponse {
  generated_text: string;
  model_used: string;
  strategy_used: string;
  tokens_generated: number;
}

// RTK Query API
export const llmApi = createApi({
  reducerPath: 'llmApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL
  }),
  tagTypes: ['LLMModels'],
  endpoints: (builder) => ({
    // GET /api/llm/models - Fetch available LLM models
    getLLMModels: builder.query<LLMModelInfo[], void>({
      query: () => '/llm/models',
      providesTags: ['LLMModels'],
    }),
    
    // POST /api/llm/generate - Generate text
    generateText: builder.mutation<LLMGenerateResponse, LLMGenerateRequest>({
      query: (body) => ({
        url: '/llm/generate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const { 
  useGetLLMModelsQuery,
  useGenerateTextMutation,
} = llmApi;
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// TypeScript types matching backend models
export interface TokenProbability {
  token: string;
  token_id: number;
  probability: number;
  log_probability: number;
}

export interface ProbabilityRequest {
  prompt: string;
  top_k?: number;
}

export interface ProbabilityResponse {
  prompt: string;
  top_tokens: TokenProbability[];
  total_tokens_considered: number;
}

// RTK Query API
export const generationApi = createApi({
  reducerPath: 'generationApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL
  }),
  tagTypes: ['Probabilities'],
  endpoints: (builder) => ({
    // POST /api/generation/probabilities - Get token probabilities
    getProbabilities: builder.query<ProbabilityResponse, ProbabilityRequest>({
      query: (body) => ({
        url: '/generation/probabilities',
        method: 'POST',
        body,
      }),
      // Cache results for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
});

// Export hooks for usage in components
export const { 
  useGetProbabilitiesQuery,
  useLazyGetProbabilitiesQuery, // For manual triggering (with debounce)
} = generationApi;
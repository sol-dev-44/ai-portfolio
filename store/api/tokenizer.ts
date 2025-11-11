import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// TypeScript types matching backend models
export interface TokenizerInfo {
  id: string;
  name: string;
  description: string;
}

export interface TokenizerResult {
  tokens: number[];
  decoded_tokens: string[];
  count: number;
  char_to_token_ratio: number;
}

export interface TokenizeRequest {
  text: string;
  tokenizers: string[];
}

export interface TokenizeResponse {
  [tokenizerName: string]: TokenizerResult;
}

// RTK Query API
export const tokenizerApi = createApi({
  reducerPath: 'tokenizerApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8080/api' 
  }),
  tagTypes: ['Tokenizers'],
  endpoints: (builder) => ({
    // GET /api/tokenizers - Fetch available tokenizers
    getTokenizers: builder.query<TokenizerInfo[], void>({
      query: () => '/tokenizers',
      providesTags: ['Tokenizers'],
    }),
    
    // POST /api/tokenize - Tokenize text
    tokenize: builder.query<TokenizeResponse, TokenizeRequest>({
      query: (body) => ({
        url: '/tokenize',
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
  useGetTokenizersQuery,
  useTokenizeQuery,
  useLazyTokenizeQuery, // For manual triggering (with debounce)
} = tokenizerApi;
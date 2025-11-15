// store/api/llm.ts
// Updated for simpler /api/hf-generate route

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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

const MODELS: LLMModelInfo[] = [
  {
    id: 'gpt2',
    name: 'GPT-2',
    description: 'OpenAI\'s GPT-2 completion model',
    parameters: '124M',
  },
  {
    id: 'qwen',
    name: 'Qwen 2.5 (0.5B)',
    description: 'Instruction-tuned chat model',
    parameters: '500M',
  },
];

export const llmApi = createApi({
  reducerPath: 'llmApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',  // Simple base URL
  }),
  tagTypes: ['LLMModels'],
  endpoints: (builder) => ({
    getLLMModels: builder.query<LLMModelInfo[], void>({
      queryFn: () => ({ data: MODELS }),
      providesTags: ['LLMModels'],
    }),
    
    generateText: builder.mutation<LLMGenerateResponse, LLMGenerateRequest>({
      query: (body) => {
        const {
          prompt,
          model_id,
          strategy,
          max_new_tokens,
          temperature,
          top_k = 50,
          top_p = 0.9,
          num_beams = 4,
        } = body;

        // Build HF parameters
        const parameters: Record<string, any> = {
          max_new_tokens,
          temperature,
          return_full_text: false,
        };

        if (strategy === 'greedy') {
          parameters.do_sample = false;
        } else if (strategy === 'top_k') {
          parameters.do_sample = true;
          parameters.top_k = top_k;
        } else if (strategy === 'top_p') {
          parameters.do_sample = true;
          parameters.top_p = top_p;
        } else if (strategy === 'beam') {
          parameters.num_beams = num_beams;
          parameters.do_sample = false;
        }

        return {
          url: '/hf-generate',  // Simpler route!
          method: 'POST',
          body: {
            model_id,
            prompt,
            parameters,
          },
        };
      },
      transformResponse: (response: any[], meta, arg) => {
        const generatedText = response[0]?.generated_text || '';
        const tokensGenerated = Math.ceil(generatedText.length / 4);

        return {
          generated_text: generatedText,
          model_used: arg.model_id,
          strategy_used: arg.strategy,
          tokens_generated: tokensGenerated,
        };
      },
    }),
  }),
});

export const { 
  useGetLLMModelsQuery,
  useGenerateTextMutation,
} = llmApi;
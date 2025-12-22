
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// =============================================================================
// TYPES
// =============================================================================

export interface MoodLensAnalysisRequest {
    imageUrl?: string;
    imageBlob?: string; // base64
}

export interface SentimentData {
    valence: number; // -1 (negative) to 1 (positive)
    arousal: number; // 0 (calm) to 1 (excited)
    dominance: number; // 0 (submissive) to 1 (dominant)
    labels: string[]; // e.g., ["Joy", "Excitement"]
}

export interface Emotion {
    name: string;
    score: number; // 0-100
}

export interface Styling {
    contrast: number; // 0-1
    brightness: number; // 0-1
    warmth: number; // 0-1
    sharpness: number; // 0-1
}

export interface MoodLensAnalysisResponse {
    description: string;
    sentiment: SentimentData;
    emotions: Emotion[]; // Granular breakdown
    style: Styling;      // Visual attributes
    colorPalette: string[]; // Hex codes
    moodKeywords: string[];
}

// =============================================================================
// RTK QUERY API
// =============================================================================

export const moodLensApi = createApi({
    reducerPath: 'moodLensApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/mood-lens' }),
    endpoints: (builder) => ({
        // POST /api/mood-lens/analyze
        analyzeImage: builder.mutation<MoodLensAnalysisResponse, MoodLensAnalysisRequest>({
            query: (body) => ({
                url: 'analyze',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useAnalyzeImageMutation } = moodLensApi;

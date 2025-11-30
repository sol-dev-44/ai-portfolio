// app/api/lsat/strategy/route.ts
// Retrieves LSAT strategies from RAG system

import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Lazy initialization
let _supabase: SupabaseClient | null = null;
let _openai: OpenAI | null = null;

function getSupabase(): SupabaseClient | null {
    if (!_supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }
    return _supabase;
}

function getOpenAI(): OpenAI | null {
    if (!_openai && process.env.OPENAI_API_KEY) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

async function generateEmbedding(text: string): Promise<number[]> {
    const openai = getOpenAI();
    if (!openai) {
        throw new Error('OpenAI not configured');
    }
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const questionType = searchParams.get('type');

    if (!query && !questionType) {
        return Response.json({
            error: 'Provide either query or type parameter'
        }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
        return Response.json({
            error: 'Supabase not configured',
            strategy: null
        }, { status: 503 });
    }

    try {
        // Build search query
        const searchQuery = query || `${questionType} LSAT strategy how to solve tips`;

        // Generate embedding
        const embedding = await generateEmbedding(searchQuery);

        // Search for strategy documents
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.3,
            match_count: 5,
        });

        if (error) {
            console.error('Strategy search error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        // Filter for strategy documents (from the ingested research)
        const strategyDocs = (data || [])
            .filter((d: any) =>
                d.url?.startsWith('lsat://strategy/') ||
                d.metadata?.type === 'lsat_strategy' ||
                d.content?.toLowerCase().includes('strategy') ||
                d.content?.toLowerCase().includes('how to')
            )
            .map((d: any) => ({
                content: d.content,
                similarity: d.similarity,
                metadata: d.metadata,
            }));

        if (strategyDocs.length === 0) {
            return Response.json({
                query: searchQuery,
                found: false,
                message: 'No specific strategy found. Using general LSAT principles.',
                strategy: null
            });
        }

        // Combine top results
        const topStrategy = strategyDocs[0];
        const relatedStrategies = strategyDocs.slice(1, 3);

        return Response.json({
            query: searchQuery,
            found: true,
            strategy: {
                content: topStrategy.content,
                similarity: topStrategy.similarity,
                metadata: topStrategy.metadata,
            },
            related: relatedStrategies.map((s: { content: string; similarity: number }) => ({
                content: s.content.substring(0, 500) + '...',
                similarity: s.similarity,
            })),
            total_found: strategyDocs.length
        });

    } catch (error) {
        console.error('Strategy retrieval error:', error);
        return Response.json({
            error: String(error),
            strategy: null
        }, { status: 500 });
    }
}

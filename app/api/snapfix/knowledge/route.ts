// app/api/snapfix/knowledge/route.ts
// RAG Knowledge Agent - Searches repair guides database

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface KnowledgeResult {
    title: string;
    content: string;
    category: string;
    similarity: number;
    source?: string;
}

export async function searchKnowledge(query: string, category: string, limit: number = 5): Promise<KnowledgeResult[]> {
    console.log(`[SnapFix Knowledge] Searching for: "${query}" (category: ${category || 'any'})`);

    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search repair guides table
    // Fetch more candidates (3x limit) to allow for filtering by app context
    const { data: results, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: limit * 3,
    });

    if (searchError) {
        console.error('[SnapFix Knowledge] Search error:', searchError);
        throw searchError;
    }

    // Filter for SnapFix-specific knowledge to avoid pollution from other apps
    const appSpecificResults = (results || []).filter((doc: any) =>
        doc.metadata?.app === 'snapfix'
    );

    const knowledgeResults: KnowledgeResult[] = appSpecificResults.map((doc: any) => ({
        title: doc.title,
        content: doc.content,
        category: doc.metadata?.category || 'general',
        similarity: doc.similarity,
        source: doc.url || doc.metadata?.source
    })).slice(0, limit); // Enforce original limit after filtering

    console.log(`[SnapFix Knowledge] Found ${knowledgeResults.length} relevant guides`);
    return knowledgeResults;
}

export async function POST(req: NextRequest) {
    try {
        const { query, category, limit = 5 } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query is required' }, { status: 400 });
        }

        const knowledgeResults = await searchKnowledge(query, category, limit);

        return Response.json({
            success: true,
            results: knowledgeResults,
            metadata: {
                query,
                category,
                total_found: knowledgeResults.length
            }
        });

    } catch (error: any) {
        console.error('[SnapFix Knowledge] Error:', error);
        return Response.json(
            {
                error: 'Knowledge search failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return Response.json({
        status: 'healthy',
        service: 'SnapFix Knowledge Agent',
        note: 'Uses Supabase pgvector for semantic search'
    });
}

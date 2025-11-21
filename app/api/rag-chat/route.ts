// app/api/rag-chat/route.ts - ENHANCED VERSION

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

interface RetrievedDoc {
  id: string;
  title: string;
  url: string;
  content: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { query, chatHistory = [] } = await req.json();

    // Validation
    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return Response.json(
        { error: 'Query too long. Maximum 500 characters.' },
        { status: 400 }
      );
    }

    console.log(`[RAG] Query from ${ip}: "${query.substring(0, 50)}..."`);

    // 1. Generate embedding for query
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (error: any) {
      console.error('[RAG] Embedding error:', error);
      throw new Error('Failed to generate query embedding');
    }

    // 2. Semantic search in Supabase
    let documents: RetrievedDoc[] = [];
    try {
      const { data, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Lower threshold for better recall
        match_count: 5,
      });

      if (searchError) throw searchError;
      documents = (data || []) as RetrievedDoc[];
      console.log(`[RAG] Retrieved ${documents.length} documents`);
    } catch (error: any) {
      console.error('[RAG] Search error:', error);
      throw new Error('Failed to search knowledge base');
    }

    // 3. Build context from retrieved documents
    const context = documents.length > 0
      ? documents
          .map((doc, i) => {
            return `[Source ${i + 1}: ${doc.title}]\n${doc.content}`;
          })
          .join('\n\n---\n\n')
      : 'No relevant documents found in the knowledge base.';

    // 4. Construct system prompt
    const systemPrompt = `You are a helpful assistant answering questions about my portfolio and work.

${documents.length > 0 ? `Use the following context to answer the question. Always cite sources using [Source X] notation.

Context:
${context}` : 'No specific context was found. Answer based on general knowledge but be clear you don\'t have specific information about this topic in the knowledge base.'}

Guidelines:
- Be conversational and friendly
- Always cite sources when using information from the context
- If the context doesn't contain relevant information, say so clearly
- Keep responses concise (2-3 paragraphs max)
- Use markdown formatting for better readability`;

    // 5. Generate response with Claude (streaming)
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        ...chatHistory.slice(-6).map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: query,
        },
      ],
      system: systemPrompt,
    });

    // 6. Create streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send sources metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'sources',
                sources: documents.map(doc => ({
                  title: doc.title,
                  url: doc.url,
                  similarity: doc.similarity,
                  preview: doc.content.substring(0, 150) + '...',
                })),
              })}\n\n`
            )
          );

          // Stream Claude's response
          let totalTokens = 0;
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              totalTokens += text.length / 4; // Rough token estimate

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'text',
                    text,
                  })}\n\n`
                )
              );
            }
          }

          // Send completion metadata
          const duration = Date.now() - startTime;
          const estimatedCost = calculateCost(query, documents, totalTokens);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                metadata: {
                  duration_ms: duration,
                  cost_usd: estimatedCost,
                  chunks_retrieved: documents.length,
                  tokens_approx: totalTokens,
                },
              })}\n\n`
            )
          );

          // Log analytics (optional)
          await logQuery({
            query,
            ip,
            documents: documents.map(d => d.id),
            duration,
            cost: estimatedCost,
          });

          controller.close();
        } catch (error: any) {
          console.error('[RAG] Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to generate response',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error: any) {
    console.error('[RAG] API error:', error);
    return Response.json(
      {
        error: error.message || 'Internal server error',
        type: error.name || 'UnknownError',
      },
      { status: 500 }
    );
  }
}

// Calculate estimated cost
function calculateCost(
  query: string,
  docs: RetrievedDoc[],
  outputTokens: number
): number {
  // Embedding cost: $0.02 per 1M tokens
  const embeddingTokens = query.length / 4;
  const embeddingCost = (embeddingTokens / 1_000_000) * 0.02;

  // Context tokens
  const contextTokens = docs.reduce((sum, doc) => sum + doc.content.length / 4, 0);

  // Claude Sonnet 4 pricing (approximate)
  // Input: ~$3 per 1M tokens, Output: ~$15 per 1M tokens
  const inputTokens = query.length / 4 + contextTokens;
  const claudeCost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

  return embeddingCost + claudeCost;
}

// Log query for analytics (optional)
async function logQuery(data: {
  query: string;
  ip: string;
  documents: string[];
  duration: number;
  cost: number;
}): Promise<void> {
  try {
    // Only log in production or if analytics table exists
    if (process.env.NODE_ENV === 'production') {
      await supabase.from('query_analytics').insert({
        query: data.query,
        retrieved_doc_ids: data.documents,
        response_time_ms: data.duration,
        cost_usd: data.cost,
      });
    }
  } catch (error) {
    // Don't throw - analytics shouldn't break the main flow
    console.error('[RAG] Failed to log analytics:', error);
  }
}

// Optional: Add a GET endpoint for health check
export async function GET() {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('documents').select('id').limit(1);

    if (error) throw error;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        embeddings: openai.apiKey ? 'configured' : 'missing',
        llm: anthropic.apiKey ? 'configured' : 'missing',
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
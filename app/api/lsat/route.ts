// app/api/lsat/route.ts
// LSAT Analysis with REAL RAG - Supabase vector search for patterns & examples

import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Lazy initialization to avoid crashes if env vars missing
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

// =============================================================================
// RAG FUNCTIONS
// =============================================================================

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

async function searchRAG(query: string, limit: number = 5): Promise<{ content: string; similarity: number; metadata: any }[]> {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn('Supabase not configured, skipping RAG');
        return [];
    }

    try {
        const embedding = await generateEmbedding(query);

        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.3,
            match_count: limit,
        });

        if (error) {
            console.error('RAG search error:', error);
            return [];
        }

        // Filter to only LSAT-related documents
        return (data || [])
            .filter((d: any) =>
                d.metadata?.type === 'lsat_pattern' ||
                d.metadata?.type === 'lsat_example' ||
                d.url?.startsWith('lsat://')
            )
            .map((d: any) => ({
                content: d.content,
                similarity: d.similarity,
                metadata: d.metadata,
            }));
    } catch (error) {
        console.error('RAG search failed:', error);
        return [];
    }
}

async function storeAnalyzedExample(
    question: any,
    analysis: any
): Promise<boolean> {
    const supabase = getSupabase();
    const openai = getOpenAI();

    if (!supabase || !openai) {
        console.warn('❌ Supabase/OpenAI not configured, skipping store');
        return false;
    }

    console.log('📝 Storing analyzed example...', analysis.pattern_type);

    try {
        const content = `
LSAT Example - Pattern: ${analysis.pattern_type}

STIMULUS: ${question.context || 'N/A'}

QUESTION: ${question.question}

OPTIONS:
${(question.options || []).map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

CORRECT: ${analysis.correct_answer?.letter}

ANALYSIS:
${analysis.breakdown?.setup || ''}
${analysis.breakdown?.logical_chain?.join(' → ') || ''}

KEY INSIGHT: ${analysis.correct_answer?.key_insight || ''}

TIPS: ${analysis.pattern_recognition_tips?.join('; ') || ''}
        `.trim();

        console.log('🔢 Generating embedding...');
        const embedding = await generateEmbedding(content);
        console.log('✅ Embedding generated, length:', embedding.length);

        const { error } = await supabase.from('documents').insert({
            title: `LSAT Example: ${analysis.pattern_type}`,
            content: content,
            embedding: embedding,
            metadata: {
                type: 'lsat_example',
                pattern_type: analysis.pattern_type,
                difficulty: analysis.difficulty,
                analyzed_at: new Date().toISOString(),
            },
            url: `lsat://example/${Date.now()}`,
            chunk_index: 0,
            total_chunks: 1,
        });

        if (error) {
            console.error('Failed to store example:', error);
            return false;
        }

        console.log(`✅ Stored LSAT example: ${analysis.pattern_type}`);
        return true;
    } catch (error) {
        console.error('Store example error:', error);
        return false;
    }
}

async function buildRAGContext(question: any): Promise<string> {
    // Create search query from question
    const searchQuery = `${question.question || ''} ${question.context || ''}`.substring(0, 500);

    // Search for relevant patterns and examples
    const results = await searchRAG(searchQuery, 5);

    if (results.length === 0) {
        return '## No relevant patterns found in knowledge base\nAnalyze based on general LSAT principles.';
    }

    // Separate patterns from examples
    const patterns = results.filter(r => r.metadata?.type === 'lsat_pattern');
    const examples = results.filter(r => r.metadata?.type === 'lsat_example');

    let context = '';

    if (patterns.length > 0) {
        context += '## RELEVANT PATTERN STRATEGIES\n\n';
        for (const p of patterns.slice(0, 2)) {
            context += `### ${p.metadata?.pattern_type?.toUpperCase() || 'Pattern'} (${Math.round(p.similarity * 100)}% match)\n`;
            context += p.content.substring(0, 1500) + '\n\n';
        }
    }

    if (examples.length > 0) {
        context += '## SIMILAR PAST QUESTIONS\n\n';
        for (const e of examples.slice(0, 2)) {
            context += `### Example (${e.metadata?.pattern_type}) - ${Math.round(e.similarity * 100)}% similar\n`;
            context += e.content.substring(0, 1000) + '\n\n';
        }
    }

    return context;
}

// =============================================================================
// HANDLERS
// =============================================================================

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = getSupabase();

    if (action === 'patterns') {
        if (!supabase) {
            return Response.json({ patterns: [], error: 'Supabase not configured' });
        }
        // Return patterns from Supabase
        const { data } = await supabase
            .from('documents')
            .select('title, metadata')
            .eq('metadata->>type', 'lsat_pattern');

        return Response.json({
            patterns: data?.map(d => d.metadata) || [],
            source: 'supabase_rag'
        });
    }

    if (action === 'stats') {
        if (!supabase) {
            return Response.json({ patterns_indexed: 0, examples_indexed: 0, rag_enabled: false });
        }

        try {
            // Count LSAT patterns
            const { count: patternCount, error: patternError } = await supabase
                .from('documents')
                .select('*', { count: 'exact', head: true })
                .like('url', 'lsat://pattern/%');

            if (patternError) {
                console.error('Pattern count error:', patternError);
            }

            // Count LSAT examples  
            const { count: exampleCount, error: exampleError } = await supabase
                .from('documents')
                .select('*', { count: 'exact', head: true })
                .like('url', 'lsat://example/%');

            if (exampleError) {
                console.error('Example count error:', exampleError);
            }

            return Response.json({
                patterns_indexed: patternCount || 0,
                examples_indexed: exampleCount || 0,
                rag_enabled: true,
            });
        } catch (error) {
            console.error('Stats error:', error);
            return Response.json({
                patterns_indexed: 0,
                examples_indexed: 0,
                rag_enabled: false,
                error: String(error)
            });
        }
    }

    return Response.json({
        service: 'LSAT Analysis API with RAG',
        rag: 'Supabase vector search',
        endpoints: ['GET ?action=patterns', 'GET ?action=stats', 'POST fetch_questions', 'POST analyze']
    });
}

export async function POST(request: NextRequest) {
    const body = await request.json();

    // Fetch questions from Python backend
    if (body.action === 'fetch_questions') {
        try {
            const res = await fetch(`${BACKEND_URL}/api/lsat/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset: body.dataset || 'tasksource/lsat-ar',
                    split: body.split || 'train',
                    count: body.count || 5
                })
            });
            return Response.json(await res.json());
        } catch {
            return Response.json({ error: 'Backend unavailable for questions' }, { status: 503 });
        }
    }

    // Analyze question with RAG
    const question = body.question_data || body.question;
    if (!question) {
        return Response.json({ error: 'No question provided' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
        return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    // Build RAG context from Supabase
    console.log('🔍 Searching RAG for relevant patterns...');
    const ragContext = await buildRAGContext(question);
    console.log(`📚 RAG context: ${ragContext.length} chars`);

    const systemPrompt = `You are an expert LSAT tutor with access to a knowledge base of patterns and examples.

Use the retrieved context below to inform your analysis. If similar examples are provided, learn from their approach.

Respond with JSON only:
{
    "pattern_type": "sequencing|grouping|matching|hybrid|strengthen|weaken|assumption|inference|flaw|parallel|principle|resolve|evaluate",
    "confidence": 0.0-1.0,
    "breakdown": {
        "setup": "what stimulus establishes",
        "question_stem": "what is asked",
        "key_constraints": ["rules/facts"],
        "logical_chain": ["step-by-step reasoning"]
    },
    "correct_answer": {
        "letter": "A-E",
        "explanation": "why correct",
        "key_insight": "crucial realization"
    },
    "incorrect_answers": [{"letter": "X", "reason": "why wrong"}],
    "pattern_recognition_tips": ["tips for similar questions"],
    "difficulty": "easy|medium|hard",
    "time_estimate_seconds": 60-180
}`;

    const userPrompt = `${ragContext}

---
## QUESTION TO ANALYZE

**Context/Stimulus:**
${question.context || 'N/A'}

**Question:**
${question.question || 'N/A'}

**Options:**
${JSON.stringify(question.options || [], null, 2)}

**Correct Answer:** ${question.answer ?? 'Unknown'}

---
Analyze this LSAT question using the pattern strategies above. Return ONLY valid JSON.`;

    // Stream from Claude
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let fullText = '';

            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': ANTHROPIC_API_KEY!,
                        'anthropic-version': '2023-06-01',
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 2000,
                        system: systemPrompt,
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true,
                    }),
                });

                if (!response.ok) {
                    controller.enqueue(encoder.encode(
                        JSON.stringify({ type: 'error', content: `Claude API error: ${response.status}` }) + '\n'
                    ));
                    controller.close();
                    return;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    controller.enqueue(encoder.encode(
                        JSON.stringify({ type: 'error', content: 'No response body' }) + '\n'
                    ));
                    controller.close();
                    return;
                }

                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') continue;

                            try {
                                const data = JSON.parse(dataStr);
                                if (data.type === 'content_block_delta' && data.delta?.text) {
                                    const text = data.delta.text;
                                    fullText += text;
                                    controller.enqueue(encoder.encode(
                                        JSON.stringify({ type: 'text', content: text }) + '\n'
                                    ));
                                }
                            } catch {
                                // skip
                            }
                        }
                    }
                }

                // Send complete event
                controller.enqueue(encoder.encode(
                    JSON.stringify({ type: 'complete', full_text: fullText }) + '\n'
                ));

                // Store as example for future RAG (async, don't wait)
                try {
                    console.log('🔄 Attempting to parse and store analysis...');

                    // Strip markdown code blocks if present
                    let jsonText = fullText.trim();
                    if (jsonText.startsWith('```json')) {
                        jsonText = jsonText.slice(7);
                    } else if (jsonText.startsWith('```')) {
                        jsonText = jsonText.slice(3);
                    }
                    if (jsonText.endsWith('```')) {
                        jsonText = jsonText.slice(0, -3);
                    }
                    jsonText = jsonText.trim();

                    const analysis = JSON.parse(jsonText);
                    console.log('✅ Parsed analysis, pattern:', analysis.pattern_type);
                    storeAnalyzedExample(question, analysis).catch(err => {
                        console.error('❌ Store failed:', err);
                    });
                } catch (parseErr) {
                    console.error('❌ JSON parse failed:', parseErr);
                }

            } catch (error) {
                controller.enqueue(encoder.encode(
                    JSON.stringify({ type: 'error', content: String(error) }) + '\n'
                ));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    });
}
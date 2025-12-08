import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Prefer Service Role for writes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function trainSystem(type: string, content: string): Promise<{ chunks: number, total_chunks: number }> {
    let textToProcess = content;
    let sourceUrl = '';
    let title = 'Manual Entry - ' + new Date().toLocaleDateString();

    // Handle URL Scraping
    if (type === 'url') {
        try {
            sourceUrl = content;
            console.log(`[SnapFix Train] Fetching URL: ${content}`);

            // Add headers to mimic a browser
            const response = await fetch(content, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/'
                }
            });

            if (response.status === 403 || response.status === 401) {
                throw new Error('Access denied by website (Bot protection). Please copy/paste the text manually.');
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();

            // Extract Title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].trim();
            }

            // Simple HTML to Text stripper
            textToProcess = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "") // Remove styles
                .replace(/<[^>]+>/g, "\n") // Replace tags with newlines
                .replace(/\s+/g, " ") // Collapse whitespace
                .trim();

            console.log(`[SnapFix Train] Extracted ${textToProcess.length} chars from URL. Title: "${title}"`);
        } catch (err: any) {
            console.error('[SnapFix Train] URL Fetch Error:', err.message);
            throw err;
        }
    } else {
        // For Manual Text, use first line as title or fallback
        const firstLine = content.split('\n')[0].substring(0, 50);
        if (firstLine) title = firstLine + (content.length > 50 ? '...' : '');
    }

    // Chunking Strategy (Simple overlap)
    const chunks = splitIntoChunks(textToProcess, 1000, 200);
    console.log(`[SnapFix Train] Created ${chunks.length} chunks`);

    let insertedCount = 0;

    // Process chunks in batches
    for (const [i, chunk] of chunks.entries()) {
        // Generate Embedding
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // Store in Supabase 'documents' table (to match existing RPC)
        const { error } = await supabase
            .from('documents')
            .insert({
                content: chunk,
                title: title,
                url: type === 'url' ? sourceUrl : `/manual/${Date.now()}`, // Fallback pseudo-URL
                chunk_index: i,
                total_chunks: chunks.length,
                metadata: {
                    source: type === 'url' ? sourceUrl : 'manual_entry',
                    type: type,
                    app: 'snapfix', // Isolation tag
                    date_added: new Date().toISOString()
                },
                embedding: embedding
            });

        if (error) {
            console.error('[SnapFix Train] Supabase Insert Error:', error);
            // Continue to next chunk but log error
        } else {
            insertedCount++;
        }
    }

    return {
        chunks: insertedCount,
        total_chunks: chunks.length
    };
}

export async function POST(req: NextRequest) {
    try {
        const { type, content } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const result = await trainSystem(type, content);

        return NextResponse.json({
            success: true,
            ...result
        });

    } catch (error: any) {
        console.error('[SnapFix Train] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// Helper: Split text into chunks with overlap
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks = [];
    let index = 0;
    while (index < text.length) {
        const chunk = text.slice(index, index + chunkSize);
        chunks.push(chunk);
        index += (chunkSize - overlap);
    }
    return chunks;
}

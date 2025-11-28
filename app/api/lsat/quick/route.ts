// app/api/lsat/quick/route.ts
// Quick LSAT solver - just the answer, no explanation
// Supports both text and image (screenshot) input

import { NextRequest } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
    const { text, image } = await request.json();

    if (!text && !image) {
        return Response.json({ error: 'Provide text or image' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
        return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    // Build the message content
    const content: any[] = [];

    // Add image if provided (base64 data URL)
    if (image) {
        // Extract base64 data and media type from data URL
        const match = image.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            const [, mediaType, base64Data] = match;
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                },
            });
        }
    }

    // Add text prompt
    content.push({
        type: 'text',
        text: image
            ? `Look at this LSAT question. Reply with ONLY the correct answer letter (A, B, C, D, or E). Nothing else.`
            : `${text}\n\n---\nReply with ONLY the correct answer letter (A, B, C, D, or E). Nothing else.`,
    });

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10, // We only need a single letter
                messages: [{
                    role: 'user',
                    content,
                }],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Claude error:', err);
            return Response.json({ error: `API error: ${response.status}` }, { status: 500 });
        }

        const data = await response.json();

        // Extract the answer letter
        const responseText = data.content
            ?.filter((block: any) => block.type === 'text')
            ?.map((block: any) => block.text)
            ?.join('') || '';

        // Clean up - extract just the letter
        const answerMatch = responseText.match(/[A-E]/i);
        const answer = answerMatch ? answerMatch[0].toUpperCase() : responseText.trim();

        return Response.json({ answer });

    } catch (error) {
        console.error('Quick solve error:', error);
        return Response.json({
            error: error instanceof Error ? error.message : 'Failed to solve'
        }, { status: 500 });
    }
}
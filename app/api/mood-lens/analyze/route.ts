
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBlob } = body; // Expecting "data:image/jpeg;base64,..."

        if (!imageBlob) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Extract base64 data and media type
        const matches = imageBlob.match(/^data:((?:image\/(?:png|jpeg|webp|gif)));base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json(
                { error: 'Invalid image format. Must be base64 data URL (png, jpeg, webp, gif).' },
                { status: 400 }
            );
        }

        const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        const base64Data = matches[2];

        const prompt = `
    Analyze this image in detail. I need a JSON response describing the visual content, granular emotional breakdown, and artistic style attributes.
    
    Output strictly valid JSON with this schema:
    {
      "description": "2-3 sentences visually describing the scene, lighting, and key elements.",
      "sentiment": {
        "valence": number, // -1.0 (negative) to 1.0 (positive)
        "arousal": number, // 0.0 (calm) to 1.0 (energetic/intense)
        "dominance": number, // 0.0 (submissive/overwhelmed) to 1.0 (dominant/in-control)
        "labels": ["string"] // 2-3 specific labels
      },
      "emotions": [
         { "name": "string", "score": number } // Top 4-5 emotions, score 0-100. Sum doesn't need to be 100.
      ],
      "style": {
        "contrast": number, // 0.0 to 1.0
        "brightness": number, // 0.0 to 1.0
        "warmth": number, // 0.0 (cool/blue) to 1.0 (warm/orange)
        "sharpness": number // 0.0 (soft/blur) to 1.0 (sharp)
      },
      "colorPalette": ["#hex", "#hex", "#hex", "#hex", "#hex"], // 5 dominant colors
      "moodKeywords": ["string", "string", "string"] // 3 abstract keywords
    }
    `;
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Data,
                            },
                        },
                        {
                            type: 'text',
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        const contentBlock = response.content[0];
        if (contentBlock.type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        }

        // Extract JSON from potential markdown wrapping
        const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Claude raw response:", contentBlock.text);
            throw new Error('Could not parse JSON from Claude response');
        }

        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json(result);

    } catch (error) {
        console.error('MoodLens Analysis Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}


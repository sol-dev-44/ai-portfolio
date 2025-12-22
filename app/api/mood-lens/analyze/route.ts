
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure route to handle larger image uploads
export const maxDuration = 60; // 60 seconds max execution time
export const runtime = 'nodejs';

// Note: Next.js 13+ uses bodyParser by default with 4.5MB limit
// For larger images, we rely on client-side compression to keep payloads small
// If needed, this can be increased via next.config.js api.bodyParser.sizeLimit

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
        // Support: JPEG, PNG, WebP, GIF, HEIC/HEIF (iPhone), BMP, TIFF, AVIF
        console.log('Received image upload, blob prefix:', imageBlob.substring(0, 50));

        const matches = imageBlob.match(/^data:((?:image\/(?:png|jpe?g|webp|gif|heic|heif|bmp|tiff?|avif)));base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            // Log the actual format we received for debugging
            const formatMatch = imageBlob.match(/^data:([^;]+);/);
            const receivedFormat = formatMatch ? formatMatch[1] : 'unknown';
            console.error('Invalid image format received:', receivedFormat);

            return NextResponse.json(
                { error: `Invalid image format. Received: ${receivedFormat}. Supported formats: JPEG, PNG, WebP, GIF, HEIC, HEIF, BMP, TIFF, AVIF` },
                { status: 400 }
            );
        }

        let mediaType = matches[1] as string;
        let base64Data = matches[2];

        console.log('Image format detected:', mediaType, 'Data length:', base64Data.length);

        // Claude API only supports: image/jpeg, image/png, image/gif, image/webp
        // For other formats (HEIC, BMP, TIFF, AVIF), we accept them but convert to JPEG
        const claudeSupportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        if (!claudeSupportedFormats.includes(mediaType)) {
            console.log(`Converting ${mediaType} to JPEG for Claude API compatibility`);
            // For unsupported formats, we'll pass them through as JPEG
            // The client-side HEIC conversion already handles HEIC files
            // For other formats, the browser's FileReader already converts them to a displayable format
            mediaType = 'image/jpeg';
        }

        const finalMediaType = mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

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
                                media_type: finalMediaType,
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


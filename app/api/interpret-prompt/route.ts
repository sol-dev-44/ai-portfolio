import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `You are a visual artist AI. Convert text prompts into parameters for a generative art engine.

Return ONLY valid JSON with these fields:

{
  "palette": [5 hex colors, from dark to light, matching the mood],
  "energy": 0-1 (0 = still/meditative, 1 = chaotic/energetic),
  "complexity": 0-1 (0 = minimal, 1 = intricate),
  "organicness": 0-1 (0 = geometric/sharp, 1 = fluid/organic),
  "density": 0-1 (0 = sparse, 1 = dense),
  "mood": "one of: serene, melancholy, anxious, joyful, mysterious, aggressive, dreamy",
  "elements": ["array of: particles, flow_field, blobs, ribbons, fog, grid, waves"],
  "shapes": ["array of: droplets, streaks, ripples, spheres, cubes"],
  "movement": "one of: floating, falling, rising, swirling, pulsing, drifting, exploding",
  "depth": 0-1 (z-space usage),
  "glow": 0-1 (bloom intensity),
  "noiseScale": 0-1 (perlin/simplex frequency),
  "contrast": 0-1 (0 = soft/hazy, 1 = sharp/contrasty),
  "temperature": 0-1 (0 = cold, 1 = warm)
}

Examples:
"underwater temple" → muted blues/greens, high organicness, floating particles, fog, dreamy
"angry static" → harsh reds/whites, high energy, grid elements, pulsing, high contrast
"childhood memory" → warm pastels, medium organicness, soft particles, drifting, low contrast, glow
"cosmic loneliness" → deep purples/blacks, low density, slow movement, high depth, mysterious
"warm anxiety" → oranges/reds, medium-high energy, pulsing movement, moderate glow`;

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Prompt is required and must be a string' },
                { status: 400 }
            );
        }

        console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: `${systemPrompt}\n\nPrompt: "${prompt}"`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Claude API error status:', response.status);
            console.error('Claude API error body:', error);
            return NextResponse.json(
                { error: 'Failed to interpret prompt', details: error },
                { status: 500 }
            );
        }

        const data = await response.json();
        const content = data.content[0].text;

        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', content);
            return NextResponse.json(
                { error: 'Invalid response format' },
                { status: 500 }
            );
        }

        const parameters = JSON.parse(jsonMatch[0]);

        return NextResponse.json(parameters);
    } catch (error) {
        console.error('Error interpreting prompt:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

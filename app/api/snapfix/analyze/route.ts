// app/api/snapfix/analyze/route.ts
// Vision Analysis Endpoint - Uses OpenAI Vision to analyze problem images

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface VisionAnalysis {
    category: 'plumbing' | 'electrical' | 'automotive' | 'appliance' | 'hvac' | 'structural' | 'general';
    symptoms: string[];
    components: string[];
    confidence: 'high' | 'medium' | 'low';
    hypothesis: string;
    safety_concerns: string[];
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;
        const userPrompt = formData.get('prompt') as string | null;

        if (!image) {
            return Response.json(
                { error: 'Image is required' },
                { status: 400 }
            );
        }

        // Convert image to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = image.type || 'image/jpeg';

        console.log(`[SnapFix Vision] Analyzing image: ${image.name}, size: ${image.size} bytes`);

        // Call OpenAI Vision API with structured output
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert diagnostic system analyzing images of problems that need repair. 
Analyze the image carefully and identify:
1. Category (plumbing, electrical, automotive, appliance, hvac, structural, or general)
2. Observable symptoms
3. Visible components
4. Your confidence level in the diagnosis
5. Initial hypothesis of what's wrong
6. Any safety concerns (electrical hazards, gas leaks, structural risks, etc.)

Be specific and detailed. If you're uncertain, say so.`
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                                detail: 'high'
                            }
                        },
                        {
                            type: 'text',
                            text: userPrompt || 'What problem do you see in this image? Please analyze it for potential repair needs.'
                        }
                    ]
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'problem_analysis',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: {
                            category: {
                                type: 'string',
                                enum: ['plumbing', 'electrical', 'automotive', 'appliance', 'hvac', 'structural', 'general']
                            },
                            symptoms: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            components: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            confidence: {
                                type: 'string',
                                enum: ['high', 'medium', 'low']
                            },
                            hypothesis: {
                                type: 'string'
                            },
                            safety_concerns: {
                                type: 'array',
                                items: { type: 'string' }
                            }
                        },
                        required: ['category', 'symptoms', 'components', 'confidence', 'hypothesis', 'safety_concerns'],
                        additionalProperties: false
                    }
                }
            },
            max_tokens: 1000
        });

        const analysis: VisionAnalysis = JSON.parse(
            response.choices[0].message.content || '{}'
        );

        console.log(`[SnapFix Vision] Analysis complete: ${analysis.category} (${analysis.confidence} confidence)`);

        return Response.json({
            success: true,
            analysis,
            metadata: {
                model: 'gpt-4o',
                tokens_used: response.usage?.total_tokens
            }
        });

    } catch (error: any) {
        console.error('[SnapFix Vision] Error:', error);
        return Response.json(
            {
                error: 'Vision analysis failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    return Response.json({
        status: 'healthy',
        service: 'SnapFix Vision Analyzer',
        model: 'gpt-4o'
    });
}

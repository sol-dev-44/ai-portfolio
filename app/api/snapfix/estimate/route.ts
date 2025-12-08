// app/api/snapfix/estimate/route.ts
// Estimation Agent - Analyzes repair difficulty, time, cost, tools, and parts needed

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface RepairEstimate {
    difficulty: 'easy' | 'moderate' | 'hard' | 'call_a_pro';
    estimated_time: string;
    estimated_cost: string;
    tools_needed: string[];
    parts_needed: string[];
    professional_recommendation: boolean;
    reasoning: string;
}

export async function estimateRepair(category: string, symptoms: string[], hypothesis: string, safety_concerns: string[]): Promise<RepairEstimate> {
    console.log(`[SnapFix Estimate] Estimating repair for ${category}: "${hypothesis}"`);

    // Build context for estimation
    const prompt = `Analyze this repair problem and provide a realistic estimate:

Category: ${category}
Problem: ${hypothesis}
Symptoms: ${symptoms?.join(', ') || 'N/A'}
Safety Concerns: ${safety_concerns?.join(', ') || 'None identified'}

Provide:
1. Difficulty level (easy, moderate, hard, or call_a_pro)
2. Estimated time range (e.g., "30 minutes - 1 hour")
3. Estimated cost range (e.g., "$20 - $50")
4. Tools needed
5. Parts likely needed
6. Whether professional help is strongly recommended
7. Reasoning for your assessment

IMPORTANT:
- If there are electrical, gas, or structural safety concerns, mark as "call_a_pro"
- Be realistic about DIY capabilities
- Consider skill level needed
- Account for special tools or equipment`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are an expert repair estimator. Be realistic and prioritize safety. Provide balanced assessments of time, cost, and difficulty.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'repair_estimate',
                strict: true,
                schema: {
                    type: 'object',
                    properties: {
                        difficulty: {
                            type: 'string',
                            enum: ['easy', 'moderate', 'hard', 'call_a_pro']
                        },
                        estimated_time: {
                            type: 'string'
                        },
                        estimated_cost: {
                            type: 'string'
                        },
                        tools_needed: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        parts_needed: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        professional_recommendation: {
                            type: 'boolean'
                        },
                        reasoning: {
                            type: 'string'
                        }
                    },
                    required: [
                        'difficulty',
                        'estimated_time',
                        'estimated_cost',
                        'tools_needed',
                        'parts_needed',
                        'professional_recommendation',
                        'reasoning'
                    ],
                    additionalProperties: false
                }
            }
        },
        max_tokens: 800
    });

    const estimate: RepairEstimate = JSON.parse(
        response.choices[0].message.content || '{}'
    );

    console.log(`[SnapFix Estimate] Difficulty: ${estimate.difficulty}, Professional: ${estimate.professional_recommendation}`);
    return estimate;
}

export async function POST(req: NextRequest) {
    try {
        const { category, symptoms, hypothesis, safety_concerns } = await req.json();

        if (!category || !hypothesis) {
            return Response.json(
                { error: 'Category and hypothesis are required' },
                { status: 400 }
            );
        }

        const estimate = await estimateRepair(category, symptoms, hypothesis, safety_concerns);

        return Response.json({
            success: true,
            estimate,
            metadata: {
                model: 'gpt-4o-mini'
            }
        });

    } catch (error: any) {
        console.error('[SnapFix Estimate] Error:', error);
        return Response.json(
            {
                error: 'Estimation failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return Response.json({
        status: 'healthy',
        service: 'SnapFix Estimation Agent',
        model: 'gpt-4o-mini'
    });
}

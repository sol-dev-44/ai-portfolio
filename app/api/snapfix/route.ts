// app/api/snapfix/route.ts  
// Main SnapFix Orchestrator - Coordinates all agents and provides streaming diagnosis

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { VisionAnalysis } from './analyze/route';
import type { KnowledgeResult } from './knowledge/route';
import type { SearchResult } from './search/route';
import type { RepairEstimate } from './estimate/route';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface DiagnosisResponse {
    diagnosis: string;
    confidence: 'high' | 'medium' | 'low';
    category: string;
    cause: string;
    fix_steps: string[];
    difficulty: 'easy' | 'moderate' | 'hard' | 'call_a_pro';
    estimated_time: string;
    estimated_cost: string;
    tools_needed: string[];
    parts_needed: string[];
    warnings: string[];
    resources: { title: string; url: string }[];
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const encoder = new TextEncoder();

    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;
        const userPrompt = formData.get('prompt') as string | null;

        if (!image) {
            return Response.json({ error: 'Image is required' }, { status: 400 });
        }

        console.log('[SnapFix Orchestrator] Starting multi-agent diagnosis...');

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Helper function to send progress updates
                    const sendProgress = (stage: string, status: string) => {
                        controller.enqueue(
                            encoder.encode(
                                JSON.stringify({ type: 'progress', stage, status }) + '\n'
                            )
                        );
                    };

                    // STAGE 1: Vision Analysis
                    sendProgress('vision', 'analyzing');
                    console.log('[SnapFix] Stage 1: Vision Analysis');

                    const visionFormData = new FormData();
                    visionFormData.append('image', image);
                    if (userPrompt) visionFormData.append('prompt', userPrompt);

                    const visionResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/snapfix/analyze`,
                        {
                            method: 'POST',
                            body: visionFormData
                        }
                    );

                    if (!visionResponse.ok) {
                        throw new Error('Vision analysis failed');
                    }

                    const { analysis }: { analysis: VisionAnalysis } = await visionResponse.json();
                    sendProgress('vision', 'complete');

                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({ type: 'vision_result', data: analysis }) + '\n'
                        )
                    );

                    // STAGE 2: Parallel Agent Calls (Knowledge, Search, Estimation)
                    sendProgress('agents', 'running');
                    console.log('[SnapFix] Stage 2: Specialist Agents (parallel)');

                    const [knowledgeData, searchData, estimateData] = await Promise.allSettled([
                        // Knowledge Agent
                        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/snapfix/knowledge`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                query: `${analysis.category} repair: ${analysis.hypothesis}`,
                                category: analysis.category,
                                limit: 3
                            })
                        }).then(r => r.json()),

                        // Web Search Agent
                        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/snapfix/search`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                query: `how to fix ${analysis.hypothesis} DIY tutorial`,
                                limit: 5
                            })
                        }).then(r => r.json()),

                        // Estimation Agent
                        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/snapfix/estimate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                category: analysis.category,
                                symptoms: analysis.symptoms,
                                hypothesis: analysis.hypothesis,
                                safety_concerns: analysis.safety_concerns
                            })
                        }).then(r => r.json())
                    ]);

                    //Extract results (graceful degradation)
                    const knowledgeResults: KnowledgeResult[] =
                        knowledgeData.status === 'fulfilled' ? knowledgeData.value.results || [] : [];
                    const searchResults: SearchResult[] =
                        searchData.status === 'fulfilled' ? searchData.value.results || [] : [];
                    const estimate: RepairEstimate | null =
                        estimateData.status === 'fulfilled' ? estimateData.value.estimate : null;

                    sendProgress('agents', 'complete');

                    // STAGE 3: Synthesis with Claude
                    sendProgress('synthesis', 'generating');
                    console.log('[SnapFix] Stage 3: Synthesis');

                    const synthesisPrompt = buildSynthesisPrompt(
                        analysis,
                        knowledgeResults,
                        searchResults,
                        estimate,
                        userPrompt
                    );

                    const claudeStream = await anthropic.messages.stream({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 2500,
                        temperature: 0.7,
                        messages: [
                            {
                                role: 'user',
                                content: synthesisPrompt
                            }
                        ]
                    });

                    // Stream Claude's synthesis
                    let fullResponse = '';
                    for await (const chunk of claudeStream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            fullResponse += chunk.delta.text;
                            controller.enqueue(
                                encoder.encode(
                                    JSON.stringify({ type: 'text', content: chunk.delta.text }) + '\n'
                                )
                            );
                        }
                    }

                    sendProgress('synthesis', 'complete');

                    // STAGE 4: Format Final Response
                    const finalDiagnosis = formatDiagnosis(
                        analysis,
                        estimate,
                        searchResults,
                        fullResponse
                    );

                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'complete',
                                diagnosis: finalDiagnosis,
                                metadata: {
                                    duration_ms: Date.now() - startTime,
                                    agents_used: {
                                        vision: true,
                                        knowledge: knowledgeData.status === 'fulfilled',
                                        search: searchData.status === 'fulfilled',
                                        estimation: estimateData.status === 'fulfilled'
                                    }
                                }
                            }) + '\n'
                        )
                    );

                    // STAGE 5: Automatic Training (Cyclical Learning)
                    // Feed the successful diagnosis back into the system
                    const trainingContent = `AUTO-GENERATED DIAGNOSIS
Problem: ${analysis.hypothesis} (${analysis.category})
Symptoms: ${analysis.symptoms.join(', ')}
Advice: ${fullResponse}`;

                    // Fire-and-forget training call (don't block response too long, but ensure execution)
                    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/snapfix/train`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'text',
                            content: trainingContent
                        })
                    }).then(() => console.log('[SnapFix] Auto-training trigger sent'))
                        .catch(e => console.error('[SnapFix] Auto-training failed:', e));

                    controller.close();

                } catch (error: any) {
                    console.error('[SnapFix Orchestrator] Error:', error);
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'error',
                                error: 'Diagnosis failed',
                                details: error.message
                            }) + '\n'
                        )
                    );
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        console.error('[SnapFix Orchestrator] Setup error:', error);
        return Response.json(
            { error: 'Failed to start diagnosis', details: error.message },
            { status: 500 }
        );
    }
}

// Build comprehensive synthesis prompt for Claude
function buildSynthesisPrompt(
    vision: VisionAnalysis,
    knowledge: KnowledgeResult[],
    search: SearchResult[],
    estimate: RepairEstimate | null,
    userPrompt: string | null
): string {
    return `You are a helpful repair advisor providing clear, actionable guidance. Synthesize the following information into a comprehensive repair diagnosis.

## Vision Analysis
Category: ${vision.category}
Confidence: ${vision.confidence}  
Hypothesis: ${vision.hypothesis}
Symptoms: ${vision.symptoms.join(', ')}
Components: ${vision.components.join(', ')}
Safety Concerns: ${vision.safety_concerns.join(', ') || 'None identified'}
${userPrompt ? `\nUser Context: ${userPrompt}` : ''}

## Knowledge Base Results
${knowledge.length > 0 ? knowledge.map((k, i) => `
${i + 1}. ${k.title}
${k.content.substring(0, 300)}...
`).join('\n') : 'No specific repair guides found in knowledge base.'}

## Web Search Results
${search.length > 0 ? search.map((s, i) => `
${i + 1}. ${s.title}
${s.url}
${s.snippet}
`).join('\n') : 'Web search unavailable.'}

## Cost/Difficulty Estimate
${estimate ? `
Difficulty: ${estimate.difficulty}
Time: ${estimate.estimated_time}
Cost: ${estimate.estimated_cost}
Tools: ${estimate.tools_needed.join(', ')}
Parts: ${estimate.parts_needed.join(', ')}
Professional Help: ${estimate.professional_recommendation ? 'RECOMMENDED' : 'Optional'}
Reasoning: ${estimate.reasoning}
` : 'Estimation unavailable.'}

---

Provide a clear, structured diagnosis with:
1. **Problem Summary**: What's wrong (2-3 sentences)
2. **Root Cause**: Why it's happening  
3. **Fix Steps**: Numbered, actionable steps (be specific!)
4. **Safety Warnings**: Any electrical, gas, structural, or other hazards
5. **When to Call a Pro**: Specific situations requiring professional help

Be conversational but professional. Prioritize safety. Be honest about difficulty.`;
}

// Format final diagnosis response
function formatDiagnosis(
    vision: VisionAnalysis,
    estimate: RepairEstimate | null,
    search: SearchResult[],
    claudeResponse: string
): DiagnosisResponse {
    // Extract fix steps from Claude's response (simple heuristic)
    const stepMatches = claudeResponse.match(/^\d+\.\s+.+$/gm) || [];
    const fix_steps = stepMatches.slice(0, 10); // Limit to 10 steps

    return {
        diagnosis: claudeResponse,
        confidence: vision.confidence,
        category: vision.category,
        cause: vision.hypothesis,
        fix_steps,
        difficulty: estimate?.difficulty || 'moderate',
        estimated_time: estimate?.estimated_time || 'Varies',
        estimated_cost: estimate?.estimated_cost || 'Depends on parts',
        tools_needed: estimate?.tools_needed || [],
        parts_needed: estimate?.parts_needed || [],
        warnings: vision.safety_concerns,
        resources: search.map(s => ({
            title: s.title,
            url: s.url,
            snippet: s.snippet,
            source: s.source || 'Web Search',
            thumbnail_url: s.thumbnail_url
        }))
    };
}

export async function GET() {
    return Response.json({
        status: 'healthy',
        service: 'SnapFix Orchestrator',
        version: '1.0',
        agents: ['vision', 'knowledge', 'search', 'estimation', 'synthesis']
    });
}

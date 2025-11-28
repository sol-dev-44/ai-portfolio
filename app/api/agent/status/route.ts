// app/api/agent/status/route.ts
// Status endpoint - checks both Claude and Open Source (HuggingFace) backends

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;

export async function GET(request: NextRequest) {
    // Check Claude availability (API key exists)
    const claudeAvailable = Boolean(ANTHROPIC_API_KEY);

    // Check HuggingFace availability (API key exists)
    const hfAvailable = Boolean(HF_API_TOKEN);

    // Available open source models
    const opensourceModels = [
        { key: 'qwen', id: 'Qwen/Qwen2.5-72B-Instruct' },
        { key: 'llama', id: 'meta-llama/Llama-3.3-70B-Instruct' },
        { key: 'deepseek', id: 'deepseek-ai/DeepSeek-R1' },
    ];

    return NextResponse.json({
        status: 'ok',
        claude: {
            available: claudeAvailable,
            model: 'claude-sonnet-4-20250514',
            message: claudeAvailable ? 'Ready' : 'ANTHROPIC_API_KEY not configured'
        },
        opensource: {
            available: hfAvailable,
            model: 'Qwen/Qwen2.5-72B-Instruct',
            models: opensourceModels,
            default_model: 'qwen',
            message: hfAvailable ? 'Ready (via HuggingFace)' : 'HF_API_TOKEN not configured'
        }
    });
}
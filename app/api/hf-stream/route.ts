// app/api/hf-stream/route.ts
import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HF_API_TOKEN;

// FIXED: Models that actually work with HuggingFace router
const MODELS = {
  'gemma-2b': 'google/gemma-2-2b-it',
  'llama-8b': 'meta-llama/Llama-3.3-70B-Instruct', 
  'gpt-oss': 'openai/gpt-oss-120b',
  'qwen-72b': 'Qwen/Qwen2.5-72B-Instruct',
  'deepseek': 'deepseek-ai/DeepSeek-R1',
};

export async function POST(request: Request) {
  try {
    const { prompt, model = 'gpt-oss' } = await request.json();

    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: 'HF_API_TOKEN not set' },
        { status: 500 }
      );
    }

    const modelId = MODELS[model as keyof typeof MODELS] || MODELS['gpt-oss'];
    
    console.log('🚀 Streaming from:', modelId);

    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    models: MODELS
  });
}
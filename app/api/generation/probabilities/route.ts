import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text || body.prompt;
    const top_k = body.top_k || 10;

    if (!text) {
      return NextResponse.json({ error: 'text or prompt is required' }, { status: 400 });
    }

    // Use OpenAI to get token probabilities via logprobs
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Continue the following text naturally. Output only the continuation, nothing else.',
        },
        { role: 'user', content: text },
      ],
      max_tokens: 50,
      temperature: 1.0,
      logprobs: true,
      top_logprobs: Math.min(top_k, 20),
    });

    const choice = response.choices[0];
    const logprobsData = choice.logprobs?.content || [];

    // Collect all unique tokens from top_logprobs across all positions
    // The frontend expects a flat list of top_tokens with probability distribution
    // Use the first token position's top_logprobs as the primary distribution
    const firstPosition = logprobsData[0];
    const top_tokens = firstPosition
      ? firstPosition.top_logprobs.map((lp, i) => ({
          token: lp.token,
          token_id: i,
          probability: Math.exp(lp.logprob),
          log_probability: lp.logprob,
        }))
      : [];

    return NextResponse.json({
      prompt: text,
      top_tokens,
      total_tokens_considered: top_tokens.length,
    });
  } catch (error: any) {
    console.error('Generation probabilities error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate probabilities' },
      { status: 500 }
    );
  }
}

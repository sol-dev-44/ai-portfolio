import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { text, model_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
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
      top_logprobs: 10,
    });

    const choice = response.choices[0];
    const logprobsData = choice.logprobs?.content || [];

    // Format probabilities like the Python backend expected
    const probabilities = logprobsData.map((tokenLogprob) => {
      const topTokens = tokenLogprob.top_logprobs.map((lp) => ({
        token: lp.token,
        probability: Math.exp(lp.logprob),
        logprob: lp.logprob,
      }));

      return {
        token: tokenLogprob.token,
        probability: Math.exp(tokenLogprob.logprob),
        logprob: tokenLogprob.logprob,
        top_alternatives: topTokens,
      };
    });

    return NextResponse.json({
      input_text: text,
      generated_text: choice.message.content,
      probabilities,
      model: 'gpt-4o-mini',
      token_count: probabilities.length,
    });
  } catch (error: any) {
    console.error('Generation probabilities error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate probabilities' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateTrace(problem: string, goldenExamples: string[] = []) {
  let prompt = '';
  if (goldenExamples.length > 0) {
    prompt += 'Here are examples of excellent reasoning:\n\n';
    goldenExamples.forEach((ex, i) => {
      prompt += `Example ${i + 1}:\n${ex}\n\n`;
    });
  }
  prompt += `Now solve this problem step by step:\n\n${problem}\n\nShow detailed reasoning. End with "Final Answer: <your answer>"`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return { reasoning: text, tokens: response.usage };
}

async function scoreTrace(trace: string, problem: string): Promise<number> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    temperature: 0.3,
    system:
      'You are a harsh but fair reasoning critic. Score the reasoning quality from 1-10. Respond with ONLY a number.',
    messages: [
      {
        role: 'user',
        content: `Problem: ${problem}\n\nReasoning:\n${trace}\n\nScore (1-10):`,
      },
    ],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '5';
  const score = parseFloat(text.match(/\d+(\.\d+)?/)?.[0] || '5');
  return Math.min(10, Math.max(1, score));
}

export async function POST(request: NextRequest) {
  try {
    const { problem, rounds = 3, traces_per_round = 3 } = await request.json();

    if (!problem) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 });
    }

    const allRounds = [];
    let goldenExamples: string[] = [];

    for (let round = 0; round < Math.min(rounds, 5); round++) {
      const traces = [];
      const n = Math.min(traces_per_round, 5);

      for (let i = 0; i < n; i++) {
        const trace = await generateTrace(problem, goldenExamples);
        const score = await scoreTrace(trace.reasoning, problem);
        traces.push({
          reasoning: trace.reasoning,
          score,
          tokens: { input: trace.tokens.input_tokens, output: trace.tokens.output_tokens },
        });
      }

      // Select golden traces (score >= 6.0, top 50% or top 2)
      const sorted = [...traces].sort((a, b) => b.score - a.score);
      const threshold = 6.0;
      const eligible = sorted.filter((t) => t.score >= threshold);
      const golden = eligible.slice(0, Math.min(2, Math.ceil(traces.length / 2)));

      goldenExamples = golden.map((g) => g.reasoning);

      allRounds.push({
        round: round + 1,
        traces: traces.map((t) => ({ reasoning: t.reasoning, score: t.score })),
        golden_count: golden.length,
        avg_score: traces.reduce((sum, t) => sum + t.score, 0) / traces.length,
        best_score: sorted[0]?.score || 0,
      });
    }

    return NextResponse.json({
      rounds: allRounds,
      total_rounds: allRounds.length,
      improvement:
        allRounds.length > 1
          ? allRounds[allRounds.length - 1].avg_score - allRounds[0].avg_score
          : 0,
    });
  } catch (error: any) {
    console.error('STaR simulation error:', error);
    return NextResponse.json(
      { error: error.message || 'STaR simulation failed' },
      { status: 500 }
    );
  }
}

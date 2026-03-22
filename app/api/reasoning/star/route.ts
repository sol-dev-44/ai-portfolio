import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROBLEMS: Record<string, string> = {
  'logic-1':
    'A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf will eat the goat, and the goat will eat the cabbage. How can the farmer get everything across safely?',
  'math-1':
    'How many times do the hour and minute hands of a clock overlap in a 12-hour period?',
  'logic-2':
    "Three people are wearing hats. Each hat is either red or blue. Each person can see the other two hats but not their own. At least one hat is red. They are asked simultaneously if they know their hat color. The first two say no. What color is the third person's hat, and how do they know?",
  'math-2':
    "You have 12 coins. One is counterfeit and weighs differently (you don't know if heavier or lighter). Using a balance scale exactly 3 times, find the counterfeit coin and determine if it's heavier or lighter.",
  'logic-3':
    'You are outside a room with 3 light switches. One controls a lightbulb inside the room. You can only enter the room once. How do you determine which switch controls the bulb?',
};

async function generateTrace(problemText: string, goldenExamples: string[] = []) {
  let prompt = '';
  if (goldenExamples.length > 0) {
    prompt += 'Here are examples of excellent reasoning:\n\n';
    goldenExamples.forEach((ex, i) => {
      prompt += `Example ${i + 1}:\n${ex}\n\n`;
    });
  }
  prompt += `Now solve this problem step by step:\n\n${problemText}\n\nShow detailed reasoning. End with "Final Answer: <your answer>"`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return { reasoning: text, tokens: response.usage };
}

async function scoreTrace(trace: string, problemText: string): Promise<number> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    temperature: 0.3,
    system:
      'You are a harsh but fair reasoning critic. Score the reasoning quality from 1-10. Respond with ONLY a number.',
    messages: [
      {
        role: 'user',
        content: `Problem: ${problemText}\n\nReasoning:\n${trace}\n\nScore (1-10):`,
      },
    ],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '5';
  const score = parseFloat(text.match(/\d+(\.\d+)?/)?.[0] || '5');
  return Math.min(10, Math.max(1, score));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem_id, custom_question, num_rounds, traces_per_round = 3 } = body;
    // Also accept "problem" and "rounds" directly for backwards compat
    const problemText =
      custom_question || body.problem || (problem_id && PROBLEMS[problem_id]);
    const rounds = num_rounds || body.rounds || 3;

    if (!problemText) {
      return NextResponse.json(
        { error: 'Either problem_id, custom_question, or problem is required' },
        { status: 400 }
      );
    }

    const allRounds = [];
    let goldenExamples: string[] = [];

    for (let round = 0; round < Math.min(rounds, 5); round++) {
      const traces = [];
      const n = Math.min(traces_per_round, 5);

      for (let i = 0; i < n; i++) {
        const trace = await generateTrace(problemText, goldenExamples);
        const score = await scoreTrace(trace.reasoning, problemText);
        traces.push({
          reasoning: trace.reasoning,
          score,
          tokens: { input: trace.tokens.input_tokens, output: trace.tokens.output_tokens },
        });
      }

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

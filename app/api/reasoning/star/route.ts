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
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let round = 0; round < Math.min(rounds, 5); round++) {
      const traces = [];
      const n = Math.min(traces_per_round, 5);

      for (let i = 0; i < n; i++) {
        const trace = await generateTrace(problemText, goldenExamples);
        const score = await scoreTrace(trace.reasoning, problemText);
        totalInputTokens += trace.tokens.input_tokens;
        totalOutputTokens += trace.tokens.output_tokens;
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
      const goldenSet = new Set(golden.map((g) => g.reasoning));

      goldenExamples = golden.map((g) => g.reasoning);

      const avgScore = traces.reduce((sum, t) => sum + t.score, 0) / traces.length;
      const prevAvg: number | null = allRounds.length > 0 ? allRounds[allRounds.length - 1].avg_score : null;

      // Extract final answer from reasoning text
      const extractFinalAnswer = (text: string) => {
        const match = text.match(/Final Answer:\s*([\s\S]*?)$/i);
        return match ? match[1].trim() : text.slice(-200);
      };

      allRounds.push({
        round_number: round + 1,
        num_traces: traces.length,
        traces: traces.map((t, i) => ({
          reasoning: t.reasoning,
          reasoning_text: t.reasoning,
          score: t.score,
          trace_index: i,
          is_golden: goldenSet.has(t.reasoning),
          final_answer: extractFinalAnswer(t.reasoning),
        })),
        golden_count: golden.length,
        avg_score: avgScore,
        best_score: sorted[0]?.score || 0,
        improvement_pct: prevAvg != null && prevAvg > 0
          ? ((avgScore - prevAvg) / prevAvg) * 100
          : undefined,
      });
    }

    const totalTokens = totalInputTokens + totalOutputTokens;
    // Rough cost estimate: Sonnet input $3/M, output $15/M
    const totalCost = (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000;

    const firstAvg = allRounds[0]?.avg_score || 0;
    const lastAvg = allRounds[allRounds.length - 1]?.avg_score || 0;
    const totalImprovementPct = firstAvg > 0
      ? ((lastAvg - firstAvg) / firstAvg) * 100
      : 0;

    return NextResponse.json({
      rounds: allRounds,
      total_rounds: allRounds.length,
      total_improvement_pct: totalImprovementPct,
      problem_text: problemText,
      total_cost: totalCost,
      total_tokens: totalTokens,
      improvement:
        allRounds.length > 1
          ? lastAvg - firstAvg
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

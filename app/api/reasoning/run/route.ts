import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt || 'You are a careful reasoning assistant.',
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

function parseAnswer(text: string): string {
  const patterns = [
    /Final Answer:\s*(.+?)(?:\n|$)/i,
    /The answer is[:\s]+(.+?)(?:\n|$)/i,
    /Therefore[,:\s]+(.+?)(?:\n|$)/i,
    /\\boxed{(.+?)}/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  const lines = text.split('\n').filter((l) => l.trim());
  return lines[lines.length - 1]?.trim() || text.trim();
}

async function zeroShotCoT(problem: string) {
  const prompt = `Solve this problem step by step:\n\n${problem}\n\nThink through this carefully, showing your reasoning at each step. End with "Final Answer: <your answer>"`;
  const result = await generateText(prompt);
  return {
    reasoning: result.text,
    answer: parseAnswer(result.text),
    tokens: { input: result.inputTokens, output: result.outputTokens },
  };
}

async function selfConsistency(problem: string, n = 3) {
  const prompt = `Solve this problem step by step:\n\n${problem}\n\nThink through this carefully. End with "Final Answer: <your answer>"`;
  const traces = [];
  for (let i = 0; i < n; i++) {
    const result = await generateText(prompt);
    traces.push({
      reasoning: result.text,
      answer: parseAnswer(result.text),
      tokens: { input: result.inputTokens, output: result.outputTokens },
    });
  }
  // Majority vote
  const answerCounts: Record<string, number> = {};
  for (const t of traces) {
    const a = t.answer.toLowerCase();
    answerCounts[a] = (answerCounts[a] || 0) + 1;
  }
  const bestAnswer = Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0][0];
  const bestTrace = traces.find((t) => t.answer.toLowerCase() === bestAnswer) || traces[0];
  return {
    traces,
    finalAnswer: bestTrace.answer,
    reasoning: bestTrace.reasoning,
    agreement: answerCounts[bestAnswer] / n,
  };
}

async function fewShotCoT(problem: string) {
  const prompt = `Here are examples of step-by-step problem solving:

Example 1:
Problem: If a train travels 60 mph for 2 hours, how far does it go?
Step 1: Distance = Speed x Time
Step 2: Distance = 60 mph x 2 hours = 120 miles
Final Answer: 120 miles

Example 2:
Problem: A store has a 25% off sale. If an item costs $80, what is the sale price?
Step 1: Calculate the discount: 25% of $80 = 0.25 x $80 = $20
Step 2: Subtract discount from original: $80 - $20 = $60
Final Answer: $60

Now solve this problem using the same step-by-step approach:

${problem}

Show your reasoning step by step. End with "Final Answer: <your answer>"`;

  const result = await generateText(prompt);
  return {
    reasoning: result.text,
    answer: parseAnswer(result.text),
    tokens: { input: result.inputTokens, output: result.outputTokens },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { problem_id, problem, strategy, expected_answer } = await request.json();

    if (!problem || !strategy) {
      return NextResponse.json({ error: 'problem and strategy are required' }, { status: 400 });
    }

    const sessionId = randomUUID();
    let result: any;

    switch (strategy) {
      case 'zero_shot_cot':
        result = await zeroShotCoT(problem);
        break;
      case 'self_consistency':
        result = await selfConsistency(problem);
        break;
      case 'few_shot_cot':
        result = await fewShotCoT(problem);
        break;
      default:
        return NextResponse.json({ error: `Unknown strategy: ${strategy}` }, { status: 400 });
    }

    // Calculate cost estimate (Claude Sonnet pricing rough estimate)
    const totalInput =
      strategy === 'self_consistency'
        ? result.traces.reduce((sum: number, t: any) => sum + t.tokens.input, 0)
        : result.tokens?.input || 0;
    const totalOutput =
      strategy === 'self_consistency'
        ? result.traces.reduce((sum: number, t: any) => sum + t.tokens.output, 0)
        : result.tokens?.output || 0;
    const costEstimate = (totalInput * 0.003 + totalOutput * 0.015) / 1000;

    // Store session in Supabase (best effort)
    try {
      await supabase.from('reasoning_sessions').insert({
        id: sessionId,
        problem_id: problem_id || 'custom',
        problem,
        strategy,
        reasoning:
          strategy === 'self_consistency' ? result.traces[0].reasoning : result.reasoning,
        answer: strategy === 'self_consistency' ? result.finalAnswer : result.answer,
        expected_answer,
        total_tokens: totalInput + totalOutput,
        cost_estimate: costEstimate,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to store reasoning session:', e);
    }

    return NextResponse.json({
      session_id: sessionId,
      strategy,
      ...result,
      cost_estimate: costEstimate,
      total_tokens: totalInput + totalOutput,
    });
  } catch (error: any) {
    console.error('Reasoning run error:', error);
    return NextResponse.json(
      { error: error.message || 'Reasoning failed' },
      { status: 500 }
    );
  }
}

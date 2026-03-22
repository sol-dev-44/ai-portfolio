import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROBLEMS: Record<string, { problem: string; expected_answer: string }> = {
  'logic-1': {
    problem:
      'A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf will eat the goat, and the goat will eat the cabbage. How can the farmer get everything across safely?',
    expected_answer:
      'Take goat across, return, take wolf across, bring goat back, take cabbage across, return, take goat across',
  },
  'math-1': {
    problem:
      'How many times do the hour and minute hands of a clock overlap in a 12-hour period?',
    expected_answer: '11 times',
  },
  'logic-2': {
    problem:
      "Three people are wearing hats. Each hat is either red or blue. Each person can see the other two hats but not their own. At least one hat is red. They are asked simultaneously if they know their hat color. The first two say no. What color is the third person's hat, and how do they know?",
    expected_answer:
      "Red. If the third person's hat were blue, the second person would see one red (first) and one blue (third), and knowing at least one is red, could deduce their own is red. Since the second person said no, the third person's hat must be red.",
  },
  'math-2': {
    problem:
      "You have 12 coins. One is counterfeit and weighs differently (you don't know if heavier or lighter). Using a balance scale exactly 3 times, find the counterfeit coin and determine if it's heavier or lighter.",
    expected_answer:
      'Divide into groups of 4. Weigh 4 vs 4. Based on result, narrow down and use remaining 2 weighings to identify the coin and whether it is heavier or lighter.',
  },
  'logic-3': {
    problem:
      'You are outside a room with 3 light switches. One controls a lightbulb inside the room. You can only enter the room once. How do you determine which switch controls the bulb?',
    expected_answer:
      "Turn on switch 1 for a few minutes, then turn it off. Turn on switch 2. Enter the room. If the bulb is on, it's switch 2. If off and warm, it's switch 1. If off and cold, it's switch 3.",
  },
};

async function generateText(
  problemText: string,
  systemPrompt?: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt || 'You are a careful reasoning assistant.',
    messages: [{ role: 'user', content: problemText }],
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
    const body = await request.json();
    const { problem_id, custom_question, strategy, n_traces, expected_answer } = body;
    // Also accept "problem" directly for backwards compat
    const problemText =
      custom_question || body.problem || (problem_id && PROBLEMS[problem_id]?.problem);

    if (!problemText || !strategy) {
      return NextResponse.json(
        { error: 'strategy and either problem_id, custom_question, or problem are required' },
        { status: 400 }
      );
    }

    const sessionId = randomUUID();
    let result: any;

    switch (strategy) {
      case 'zero_shot_cot':
        result = await zeroShotCoT(problemText);
        break;
      case 'self_consistency':
        result = await selfConsistency(problemText, n_traces || 3);
        break;
      case 'few_shot_cot':
        result = await fewShotCoT(problemText);
        break;
      default:
        return NextResponse.json({ error: `Unknown strategy: ${strategy}` }, { status: 400 });
    }

    const totalInput =
      strategy === 'self_consistency'
        ? result.traces.reduce((sum: number, t: any) => sum + t.tokens.input, 0)
        : result.tokens?.input || 0;
    const totalOutput =
      strategy === 'self_consistency'
        ? result.traces.reduce((sum: number, t: any) => sum + t.tokens.output, 0)
        : result.tokens?.output || 0;
    const costEstimate = (totalInput * 0.003 + totalOutput * 0.015) / 1000;

    try {
      await supabase.from('reasoning_sessions').insert({
        id: sessionId,
        problem_id: problem_id || 'custom',
        problem: problemText,
        strategy,
        reasoning:
          strategy === 'self_consistency' ? result.traces[0].reasoning : result.reasoning,
        answer: strategy === 'self_consistency' ? result.finalAnswer : result.answer,
        expected_answer: expected_answer || PROBLEMS[problem_id]?.expected_answer,
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

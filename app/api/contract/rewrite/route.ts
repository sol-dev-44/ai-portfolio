import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a legal contract specialist. Your task is to rewrite contract clauses to be more balanced and protect both parties while maintaining legal validity.

IMPORTANT: Respond with valid JSON only:
{
    "original": "The original clause",
    "rewritten": "The improved clause",
    "changes_made": ["List of specific changes"],
    "risk_reduction": "How this rewrite reduces risk",
    "notes": "Any additional considerations"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clause_text, risk_type, context } = body;

    if (!clause_text || typeof clause_text !== 'string') {
      return NextResponse.json(
        { error: 'clause_text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!risk_type || typeof risk_type !== 'string') {
      return NextResponse.json(
        { error: 'risk_type is required and must be a string' },
        { status: 400 }
      );
    }

    const contextLine = context ? `\nAdditional context: ${context}\n` : '';

    const userPrompt = `Please rewrite the following contract clause to mitigate ${risk_type} risks:

Original clause:
"${clause_text}"
${contextLine}
Provide a balanced rewrite that protects both parties while maintaining legal validity.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from Claude response');
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Rewrite endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite clause' },
      { status: 500 }
    );
  }
}

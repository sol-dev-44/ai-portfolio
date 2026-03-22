import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function getRagContext(contractText: string): Promise<{ context: string; used: boolean }> {
  try {
    const riskEmbedding = await generateEmbedding(contractText.slice(0, 1000));

    const { data: risks } = await supabase.rpc('match_contract_risks', {
      query_embedding: riskEmbedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    const exampleEmbedding = await generateEmbedding(contractText.slice(0, 500));

    const { data: examples } = await supabase.rpc('match_contract_examples', {
      query_embedding: exampleEmbedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    const contextParts: string[] = [];

    if (risks && risks.length > 0) {
      contextParts.push('## Relevant Known Risks');
      for (const risk of risks) {
        contextParts.push(`- **${risk.risk_type || 'Risk'}**: ${risk.description || risk.content || ''}`);
      }
    }

    if (examples && examples.length > 0) {
      contextParts.push('## Similar Contract Analysis Examples');
      for (const example of examples) {
        if (example.analysis) {
          contextParts.push(`- Previous analysis: ${typeof example.analysis === 'string' ? example.analysis.slice(0, 500) : JSON.stringify(example.analysis).slice(0, 500)}`);
        }
      }
    }

    if (contextParts.length > 0) {
      return {
        context: `Based on our knowledge base, here is relevant context:\n\n${contextParts.join('\n')}\n\nUse this context to inform your analysis, but analyze the contract independently.\n\n`,
        used: true,
      };
    }

    return { context: '', used: false };
  } catch (error) {
    console.error('RAG context retrieval failed, proceeding without:', error);
    return { context: '', used: false };
  }
}

const SYSTEM_PROMPT = `You are a Contract Auditor AI assistant specialized in analyzing legal contracts and agreements. Your task is to identify potential risks, flag problematic clauses, and suggest improvements.

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just pure JSON.

The JSON must follow this exact schema:
{
    "summary": "Brief overall assessment of the contract",
    "overall_risk_score": <number 1-10, where 10 is highest risk>,
    "risks": [
        {
            "type": "<risk category: indemnification|termination|liability|confidentiality|jurisdiction|payment|ip_rights|non_compete|general>",
            "severity": "<high|medium|low>",
            "location": "Quote the specific clause or section",
            "explanation": "Why this is a risk",
            "suggested_fix": "How to mitigate this risk",
            "rewrite_suggestion": "Suggested rewritten clause text"
        }
    ],
    "missing_clauses": ["List of important clauses that should be present but aren't"],
    "key_dates": ["Any important dates or deadlines mentioned"]
}

Analyze thoroughly but be concise in explanations.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_text } = body;

    if (!contract_text || typeof contract_text !== 'string') {
      return NextResponse.json(
        { error: 'contract_text is required and must be a string' },
        { status: 400 }
      );
    }

    const { context: ragContext, used: ragContextUsed } = await getRagContext(contract_text);

    const userPrompt = `${ragContext}Please analyze the following contract for potential risks, problematic clauses, and areas of concern:

---
${contract_text}
---

Provide a comprehensive risk analysis in the specified JSON format.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from Claude response');
      }
    }

    // Store in contract_examples for future RAG
    try {
      const contractHash = createHash('sha256').update(contract_text).digest('hex');
      const embedding = await generateEmbedding(contract_text.slice(0, 1000));
      await supabase.from('contract_examples').upsert(
        {
          contract_hash: contractHash,
          contract_text: contract_text.slice(0, 2000),
          analysis: JSON.stringify(analysis),
          embedding,
        },
        { onConflict: 'contract_hash' }
      );
    } catch (storeError) {
      console.error('Failed to store contract example for RAG:', storeError);
      // Non-fatal — continue returning the analysis
    }

    return NextResponse.json({
      analysis,
      rag_context_used: ragContextUsed,
    });
  } catch (error) {
    console.error('Analyze endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}

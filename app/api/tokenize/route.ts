import { NextRequest, NextResponse } from 'next/server';
import { getEncoding } from 'js-tiktoken';

const SUPPORTED = ['cl100k_base', 'p50k_base', 'r50k_base', 'o200k_base'];

export async function POST(request: NextRequest) {
  try {
    const { text, tokenizers } = await request.json();

    if (!text || !tokenizers || !Array.isArray(tokenizers) || tokenizers.length === 0) {
      return NextResponse.json(
        { error: 'text and tokenizers (array) are required' },
        { status: 400 }
      );
    }

    const invalid = tokenizers.filter((t: string) => !SUPPORTED.includes(t));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Unsupported tokenizer(s): ${invalid.join(', ')}. Use: ${SUPPORTED.join(', ')}` },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    for (const tokenizerName of tokenizers) {
      const enc = getEncoding(tokenizerName as any);
      const tokenIds = enc.encode(text);

      const decoded_tokens = Array.from(tokenIds).map((tokenId) => {
        return enc.decode(new Uint32Array([tokenId]));
      });

      const count = tokenIds.length;

      results[tokenizerName] = {
        tokens: Array.from(tokenIds),
        decoded_tokens,
        count,
        char_to_token_ratio: count > 0 ? parseFloat((text.length / count).toFixed(2)) : 0,
      };

      if (typeof enc.free === 'function') enc.free();
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Tokenize error:', error);
    return NextResponse.json(
      { error: error.message || 'Tokenization failed' },
      { status: 500 }
    );
  }
}

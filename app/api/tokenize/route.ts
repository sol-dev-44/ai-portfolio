import { NextRequest, NextResponse } from 'next/server';
import { getEncoding } from 'js-tiktoken';

const SUPPORTED = ['cl100k_base', 'p50k_base', 'r50k_base', 'o200k_base'];

export async function POST(request: NextRequest) {
  try {
    const { text, tokenizer } = await request.json();

    if (!text || !tokenizer) {
      return NextResponse.json({ error: 'text and tokenizer are required' }, { status: 400 });
    }

    if (!SUPPORTED.includes(tokenizer)) {
      return NextResponse.json(
        { error: `Unsupported tokenizer. Use: ${SUPPORTED.join(', ')}` },
        { status: 400 }
      );
    }

    const enc = getEncoding(tokenizer as any);
    const tokens = enc.encode(text);

    // Decode each token individually to get the text representation
    const tokenDetails = Array.from(tokens).map((tokenId, index) => {
      const decoded = enc.decode(new Uint32Array([tokenId]));
      return {
        id: tokenId,
        text: decoded,
        index,
      };
    });

    enc.free(); // Clean up WASM memory

    return NextResponse.json({
      tokens: tokenDetails,
      token_count: tokens.length,
      tokenizer,
      text_length: text.length,
    });
  } catch (error: any) {
    console.error('Tokenize error:', error);
    return NextResponse.json(
      { error: error.message || 'Tokenization failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

const SUPPORTED_TOKENIZERS = {
  cl100k_base: {
    name: 'cl100k_base',
    description: 'GPT-4, GPT-3.5-turbo, text-embedding-ada-002',
    model_family: 'GPT-4/3.5',
  },
  p50k_base: {
    name: 'p50k_base',
    description: 'Codex models, text-davinci-002/003',
    model_family: 'GPT-3',
  },
  r50k_base: {
    name: 'r50k_base',
    description: 'GPT-3 models like davinci',
    model_family: 'GPT-3 (legacy)',
  },
  o200k_base: {
    name: 'o200k_base',
    description: 'GPT-4o models',
    model_family: 'GPT-4o',
  },
};

export async function GET() {
  return NextResponse.json({
    tokenizers: Object.values(SUPPORTED_TOKENIZERS),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_hash, feedback, rating } = body;

    if (!contract_hash || typeof contract_hash !== 'string') {
      return NextResponse.json(
        { error: 'contract_hash is required and must be a string' },
        { status: 400 }
      );
    }

    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json(
        { error: 'feedback is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'rating is required and must be a number' },
        { status: 400 }
      );
    }

    try {
      await supabase.from('contract_feedback').insert({
        contract_hash,
        feedback,
        rating,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Graceful degradation — table may not exist yet
      console.warn('contract_feedback table may not exist, skipping insert');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

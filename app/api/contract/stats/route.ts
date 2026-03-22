import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Try the dedicated RPC first
    const { data, error } = await supabase.rpc('get_contract_rag_stats');
    if (data && !error) {
      return NextResponse.json(data);
    }

    // Fallback to individual counts
    const risks = await supabase
      .from('contract_risks')
      .select('id', { count: 'exact', head: true });

    const examples = await supabase
      .from('contract_examples')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      total_risks: risks.count || 0,
      total_examples: examples.count || 0,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

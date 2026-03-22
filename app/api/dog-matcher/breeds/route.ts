import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: breeds, error } = await supabase.from('dog_breeds').select('*');

    if (error) {
      console.error('Supabase error fetching breeds:', error);
      return NextResponse.json({ error: 'Failed to fetch breeds' }, { status: 500 });
    }

    // Process images field same as Python backend
    for (const breed of breeds) {
      breed.images = breed.images || (breed.image_url ? [breed.image_url] : []);
    }

    return NextResponse.json({ breeds, count: breeds.length });
  } catch (err) {
    console.error('Error fetching breeds:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

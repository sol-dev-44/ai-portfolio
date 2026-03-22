import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type QuizAnswers = Record<string, string | string[]>;

interface BreedRecord {
  size_category?: string;
  energy_level?: string;
  apartment_friendly?: boolean;
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  shedding_level?: string;
  similarity_score?: number;
  images?: string[];
  image_url?: string;
  match_reasons?: string[];
  [key: string]: unknown;
}

function buildUserProfileText(answers: QuizAnswers): string {
  const parts: string[] = [];

  const mapping: Record<string, string> = {
    living_space: 'I live in a {value}',
    yard_size: 'I have a {value} yard',
    activity_level: 'My activity level is {value}',
    experience: 'My dog experience level is {value}',
    time_alone: 'The dog would be alone {value}',
    grooming_willingness: 'My grooming willingness is {value}',
    noise_tolerance: 'My noise tolerance is {value}',
    size_preference: 'I prefer {value} sized dogs',
    purpose: 'I want a dog for {value}',
    children: 'I have children: {value}',
    other_pets: 'I have other pets: {value}',
    climate: 'I live in a {value} climate',
    budget: 'My budget for dog care is {value}',
    allergies: 'Allergy concerns: {value}',
  };

  for (const [key, template] of Object.entries(mapping)) {
    let value = answers[key];
    if (value) {
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      parts.push(template.replace('{value}', value as string));
    }
  }

  if (answers.priorities) {
    const priorities = answers.priorities;
    if (Array.isArray(priorities)) {
      parts.push(`My priorities are: ${priorities.join(', ')}`);
    }
  }

  if (answers.additional_notes) {
    parts.push(`Additional notes: ${answers.additional_notes}`);
  }

  return parts.join('. ') + '.';
}

function calculateMatchReasons(breed: BreedRecord, answers: QuizAnswers): string[] {
  const reasons: string[] = [];

  const sizePref = ((answers.size_preference as string) || '').toLowerCase();
  const breedSize = (breed.size_category || '').toLowerCase();
  if (sizePref && breedSize && breedSize.includes(sizePref)) {
    reasons.push(`Perfect size match - you prefer ${sizePref} dogs`);
  }

  const activity = ((answers.activity_level as string) || '').toLowerCase();
  const energy = (breed.energy_level || '').toLowerCase();
  if (activity && energy) {
    const activityEnergyMap: Record<string, string[]> = {
      'very active': ['high', 'very high'],
      active: ['medium', 'high'],
      moderate: ['medium', 'low'],
      low: ['low', 'very low'],
    };
    const matching = activityEnergyMap[activity] || [];
    if (matching.includes(energy)) {
      reasons.push(`Great energy match for your ${activity} lifestyle`);
    }
  }

  const living = ((answers.living_space as string) || '').toLowerCase();
  if (living.includes('apartment') && breed.apartment_friendly) {
    reasons.push('Well-suited for apartment living');
  }

  if (answers.children && breed.good_with_kids) {
    reasons.push('Known to be great with children');
  }

  if (answers.other_pets && breed.good_with_pets) {
    reasons.push('Gets along well with other pets');
  }

  const grooming = ((answers.grooming_willingness as string) || '').toLowerCase();
  const shedding = (breed.shedding_level || '').toLowerCase();
  if (['minimal', 'low'].includes(grooming) && ['low', 'minimal'].includes(shedding)) {
    reasons.push('Low shedding - perfect for your grooming preference');
  }

  if (reasons.length === 0) {
    const score = breed.similarity_score || 0;
    if (score > 0.7) {
      reasons.push('Excellent overall personality and lifestyle match');
    } else if (score > 0.5) {
      reasons.push('Strong compatibility with your preferences');
    } else {
      reasons.push('Good potential match based on your profile');
    }
  }

  return reasons;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quiz_answers, top_k = 5 } = body as {
      quiz_answers: QuizAnswers;
      top_k?: number;
    };

    if (!quiz_answers) {
      return NextResponse.json({ error: 'quiz_answers is required' }, { status: 400 });
    }

    // Build profile text from quiz answers
    const profileText = buildUserProfileText(quiz_answers);

    // Generate embedding via OpenAI
    const embeddingResponse = await openai.embeddings.create({
      input: profileText,
      model: 'text-embedding-3-small',
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Call Supabase RPC for vector similarity search
    const { data: result, error } = await supabase.rpc('match_dog_breeds', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: top_k,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Failed to match breeds' }, { status: 500 });
    }

    // Process matches: add match_reasons and normalize images
    const matches = (result || []).map((breed: BreedRecord) => {
      const breedData = { ...breed };
      breedData.match_reasons = calculateMatchReasons(breed, quiz_answers);
      breedData.images = breed.images || (breed.image_url ? [breed.image_url] : []);
      return breedData;
    });

    return NextResponse.json({ matches, profile_summary: profileText });
  } catch (err) {
    console.error('Error matching breeds:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

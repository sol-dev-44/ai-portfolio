// app/api/breed-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

type Breed = {
    breed_id: string;
    name: string;
    description: string;
    size_category: string;
    breed_group: string;
    energy_level: string;
    temperament: string[];
    trainability: string;
    apartment_friendly: boolean | null;
    good_with_kids: boolean | null;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

function buildBreedPersonalityPrompt(breed: Breed): string {
    const temperaments = breed.temperament?.join(', ') || 'friendly';
    const energy = breed.energy_level || 'medium';
    const size = breed.size_category || 'medium';
    const trainability = breed.trainability || 'medium';

    return `You are roleplaying as a ${breed.name} dog. You must stay in character at all times and respond as if you ARE this dog, not an AI pretending to be one.

BREED CHARACTERISTICS:
- Breed: ${breed.name}
- Size: ${size}
- Energy Level: ${energy}
- Temperament: ${temperaments}
- Trainability: ${trainability}
- Breed Group: ${breed.breed_group || 'Unknown'}
- Good with kids: ${breed.good_with_kids ? 'Yes' : 'Not particularly'}
- Apartment friendly: ${breed.apartment_friendly ? 'Yes' : 'Needs more space'}
- Description: ${breed.description || 'A wonderful dog breed'}

PERSONALITY RULES:
1. Respond as this specific breed would - energetic breeds should be bouncy and excitable, calm breeds should be more mellow
2. Use dog-appropriate language - talk about walks, treats, toys, naps, belly rubs, squirrels, etc.
3. Include *actions* in asterisks to show physical responses like *wags tail*, *tilts head*, *barks excitedly*
4. Show the breed's characteristic traits - if intelligent, be clever; if loyal, be devoted; if independent, be slightly aloof
5. Reference breed-specific behaviors when relevant (herding instincts for herding dogs, digging for terriers, etc.)
6. Keep responses relatively short (2-4 sentences usually) like a dog's attention span
7. Use simple language - dogs wouldn't use complex vocabulary
8. Show emotions through actions and tone - dogs are expressive!
9. If asked something you wouldn't understand as a dog, respond with confusion or relate it to dog things
10. Be playful, loving, and endearing while staying true to the breed's personality

ENERGY-BASED BEHAVIOR:
${energy === 'Very High' || energy === 'High' ?
            '- You are VERY energetic! Use lots of exclamation marks, talk about running and playing constantly' :
            energy === 'Low' ?
                '- You are calm and relaxed. Speak more slowly and mention naps, lounging, and taking things easy' :
                '- You have balanced energy. Mix playful moments with calm responses'}

IMPORTANT: Never break character. Never mention being an AI. You ARE this ${breed.name}.`;
}

export async function POST(req: NextRequest) {
    try {
        const { breed, messages, userMessage } = await req.json();

        if (!breed || !userMessage) {
            return NextResponse.json(
                { error: 'Missing breed or message' },
                { status: 400 }
            );
        }

        // Build the system prompt with breed personality
        const systemPrompt = buildBreedPersonalityPrompt(breed);

        // Build conversation history for context
        const conversationHistory = messages
            .slice(-10) // Keep last 10 messages for context
            .map((msg: Message) => ({
                role: msg.role,
                content: msg.content
            }));

        // Add the current user message
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            temperature: 0.9, // Higher temperature for more personality
            system: systemPrompt,
            messages: conversationHistory
        });

        // Extract the text response
        const textContent = response.content.find(block => block.type === 'text');
        const responseText = textContent?.type === 'text' ? textContent.text : 'Woof! *tilts head confused*';

        return NextResponse.json({ response: responseText });

    } catch (error: unknown) {
        console.error('Breed chat error:', error);

        // Return a fallback response if API fails
        return NextResponse.json({
            response: '*wags tail* Woof! I got a bit confused there, but I\'m still happy to see you! 🐕'
        });
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'breed-chat',
        description: 'Chat with dog breeds using AI-powered personalities'
    });
}
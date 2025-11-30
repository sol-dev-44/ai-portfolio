import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { command } = await request.json();

        if (!command || typeof command !== 'string') {
            return NextResponse.json(
                { error: 'Invalid command' },
                { status: 400 }
            );
        }

        // Use OpenAI to parse the natural language command
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a robot command parser. Convert natural language commands into structured robot control states.

Available actions: idle, wave, dance, walk, jump
Available expressions: neutral, happy, sad, surprised, excited, thinking
Speed range: 0.5 to 2.0 (default: 1.0)

Parse the user's command and return ONLY a JSON object with this exact structure:
{
  "action": "one of the available actions",
  "expression": "one of the available expressions",
  "speed": number between 0.5 and 2.0
}

Examples:
- "make him wave" -> {"action": "wave", "expression": "neutral", "speed": 1.0}
- "dance happily" -> {"action": "dance", "expression": "happy", "speed": 1.0}
- "walk sadly" -> {"action": "walk", "expression": "sad", "speed": 1.0}
- "jump excitedly" -> {"action": "jump", "expression": "excited", "speed": 1.0}
- "look surprised and wave" -> {"action": "wave", "expression": "surprised", "speed": 1.0}
- "go faster" -> {"action": "idle", "expression": "neutral", "speed": 2.0}
- "slow down" -> {"action": "idle", "expression": "neutral", "speed": 0.5}
- "dance quickly" -> {"action": "dance", "expression": "neutral", "speed": 1.8}
- "wave slowly and sadly" -> {"action": "wave", "expression": "sad", "speed": 0.7}

Speed keywords:
- "faster", "quickly", "fast", "speed up" -> increase speed (1.5-2.0)
- "slower", "slowly", "slow down" -> decrease speed (0.5-0.7)
- "normal", "regular" -> default speed (1.0)

If the command doesn't specify an action, default to "idle".
If the command doesn't specify an expression, default to "neutral".
If the command doesn't specify speed, default to 1.0.
Always return valid JSON only, no other text.`,
                },
                {
                    role: 'user',
                    content: command,
                },
            ],
            temperature: 0.3,
            max_tokens: 100,
        });

        const responseText = completion.choices[0].message.content?.trim() || '';

        // Parse the JSON response
        let parsedCommand;
        try {
            parsedCommand = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', responseText);
            // Fallback to defaults
            parsedCommand = { action: 'idle', expression: 'neutral', speed: 1.0 };
        }

        // Validate the parsed command
        const validActions = ['idle', 'wave', 'dance', 'walk', 'jump'];
        const validExpressions = ['neutral', 'happy', 'sad', 'surprised', 'excited', 'thinking'];

        const action = validActions.includes(parsedCommand.action) ? parsedCommand.action : 'idle';
        const expression = validExpressions.includes(parsedCommand.expression) ? parsedCommand.expression : 'neutral';
        const speed = typeof parsedCommand.speed === 'number'
            ? Math.max(0.5, Math.min(2.0, parsedCommand.speed))
            : 1.0;

        return NextResponse.json({
            action,
            expression,
            speed,
            originalCommand: command,
        });

    } catch (error) {
        console.error('Error parsing command:', error);
        return NextResponse.json(
            { error: 'Failed to parse command' },
            { status: 500 }
        );
    }
}

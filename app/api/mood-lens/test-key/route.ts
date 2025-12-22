import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                status: 'error',
                message: 'ANTHROPIC_API_KEY not found in environment variables'
            }, { status: 500 });
        }

        // Test the API key with a simple request
        const anthropic = new Anthropic({ apiKey });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{
                role: 'user',
                content: 'Say hi'
            }]
        });

        return NextResponse.json({
            status: 'success',
            message: 'API key is valid and working',
            model: 'claude-sonnet-4-20250514',
            response: response.content[0].type === 'text' ? response.content[0].text : 'OK'
        });

    } catch (error: any) {
        console.error('API Key test failed:', error);
        return NextResponse.json({
            status: 'error',
            message: error.message || 'Unknown error',
            errorType: error.constructor.name,
            statusCode: error.status
        }, { status: 500 });
    }
}

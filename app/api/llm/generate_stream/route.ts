import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://127.0.0.1:8080';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_URL}/api/llm/generate_stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend error: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Pass the stream through
        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error proxying to backend:', error);
        return NextResponse.json(
            { error: 'Failed to connect to backend' },
            { status: 500 }
        );
    }
}

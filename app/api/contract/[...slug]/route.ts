import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await context.params;
    const slugString = slug.join('/');
    const url = `${BACKEND_URL}/api/contract/${slugString}`;

    try {
        const body = await request.json();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Proxy error for ${url}:`, error);
        return NextResponse.json(
            { error: 'Failed to connect to backend service' },
            { status: 503 }
        );
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await context.params;
    const slugString = slug.join('/');
    const url = `${BACKEND_URL}/api/contract/${slugString}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`Proxy error for ${url}:`, error);
        return NextResponse.json(
            { error: 'Failed to connect to backend service' },
            { status: 503 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/contract/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Stats endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats from backend' },
            { status: 503 }
        );
    }
}

// app/api/snapfix/search/route.ts
// Web Search Agent - Uses You.com API for current repair information

import { NextRequest } from 'next/server';

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    page_age?: string;
    source?: string;
    thumbnail_url?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { query, limit = 5 } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query is required' }, { status: 400 });
        }

        const YOU_API_KEY = process.env.YOU_API_KEY;

        if (!YOU_API_KEY) {
            console.warn('[SnapFix Search] YOU_API_KEY not configured, returning mock data');
            // Return mock data if API key not configured
            return Response.json({
                success: true,
                results: [
                    {
                        title: 'Common Repair Fixes - DIY Guide',
                        url: 'https://example.com/repair-guide',
                        snippet: 'Learn how to fix common repair issues yourself...'
                    }
                ],
                metadata: {
                    query,
                    source: 'mock',
                    note: 'Configure YOU_API_KEY for real search results'
                }
            });
        }

        console.log(`[SnapFix Search] Searching web for: "${query}"`);

        // Build You.com API URL (YDC Index)
        const searchUrl = new URL('https://ydc-index.io/search');
        searchUrl.searchParams.append('query', query);
        searchUrl.searchParams.append('count', limit.toString());
        searchUrl.searchParams.append('safesearch', 'moderate');

        // Call You.com Web Search API
        let response = await fetch(searchUrl.toString(), {
            method: 'GET',
            headers: {
                'X-API-Key': YOU_API_KEY
            }
        });

        // Retry logic: If 500 error, try with simplified query
        if (response.status >= 500) {
            console.warn(`[SnapFix Search] API 500 Error. Retrying with simplified query...`);
            const simpleQuery = query.split('.')[0];
            searchUrl.searchParams.set('query', simpleQuery);

            response = await fetch(searchUrl.toString(), {
                method: 'GET',
                headers: { 'X-API-Key': YOU_API_KEY }
            });
        }

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`You.com API error: ${response.status} - ${errorBody.substring(0, 100)}`);
        }

        const data = await response.json();

        // Log keys to debug structure
        console.log('[SnapFix Search] API Response Keys:', Object.keys(data));
        if (data.results) console.log('[SnapFix Search] data.results type:', typeof data.results, Array.isArray(data.results));
        if (data.hits) console.log('[SnapFix Search] data.hits type:', typeof data.hits, Array.isArray(data.hits));

        // Extract results (flexible parsing for 'results' or 'hits')
        let rawResults = [];
        if (data.results?.web) rawResults = data.results.web;
        else if (Array.isArray(data.results)) rawResults = data.results;
        else if (Array.isArray(data.hits)) rawResults = data.hits;

        const webResults = rawResults.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.description || r.snippets?.[0] || '',
            page_age: r.page_age,
            thumbnail_url: r.thumbnail_url
        }));

        const newsResults = data.results?.news?.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.description,
            page_age: r.page_age,
            thumbnail_url: r.thumbnail_url
        })) || [];

        const searchResults: SearchResult[] = [...webResults, ...newsResults].slice(0, limit);

        console.log(`[SnapFix Search] Found ${searchResults.length} results`);

        return Response.json({
            success: true,
            results: searchResults,
            metadata: {
                query,
                source: 'you.com',
                total_found: searchResults.length,
                latency_ms: data.metadata?.latency
            }
        });

    } catch (error: any) {
        console.error('[SnapFix Search] Error:', error);
        return Response.json(
            {
                error: 'Web search failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const hasApiKey = !!process.env.YOU_API_KEY;
    return Response.json({
        status: hasApiKey ? 'healthy' : 'degraded',
        service: 'SnapFix Web Search Agent',
        provider: 'you.com',
        api_key_configured: hasApiKey
    });
}

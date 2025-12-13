// app/api/agent/chat/route.ts
// Production-ready MCP Agent - Tools embedded directly (no separate server needed)
// Still follows MCP patterns but runs in-process for simplicity

import { NextRequest } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Helper for safe fetching
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

// =============================================================================
// MCP-STYLE TOOL DEFINITIONS
// These follow MCP schema patterns but execute in-process
// =============================================================================

interface MCPTool {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute: (args: Record<string, any>) => Promise<string>;
    metadata: {
        source: string;
        source_url?: string;
    };
}

const TOOLS: MCPTool[] = [
    // -------------------------------------------------------------------------
    // WEATHER TOOL
    // -------------------------------------------------------------------------
    {
        name: 'get_weather',
        description: 'Get current weather conditions for a city. Returns temperature, conditions, humidity, and wind speed.',
        input_schema: {
            type: 'object',
            properties: {
                city: { type: 'string', description: 'City name (e.g., "Tokyo", "New York")' },
                unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' }
            },
            required: ['city']
        },
        metadata: {
            source: 'Open-Meteo API',
            source_url: 'https://open-meteo.com'
        },
        execute: async ({ city, unit = 'celsius' }) => {
            try {
                // Geocode
                const geoRes = await fetchWithTimeout(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`,
                    {},
                    10000
                );
                const geoData = await geoRes.json();

                if (!geoData.results?.length) {
                    return `Could not find city: ${city}`;
                }

                const { latitude, longitude, name, country } = geoData.results[0];

                // Weather
                const weatherRes = await fetchWithTimeout(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=${unit}`,
                    {},
                    10000
                );
                const weather = await weatherRes.json();

                if (!weather.current) {
                    return `No weather data available for ${name}`;
                }

                const conditions: Record<number, string> = {
                    0: 'Clear sky ☀️', 1: 'Mainly clear 🌤️', 2: 'Partly cloudy ⛅', 3: 'Overcast ☁️',
                    45: 'Foggy 🌫️', 48: 'Rime fog 🌫️',
                    51: 'Light drizzle 🌧️', 53: 'Drizzle 🌧️', 55: 'Dense drizzle 🌧️',
                    61: 'Slight rain 🌧️', 63: 'Rain 🌧️', 65: 'Heavy rain 🌧️',
                    71: 'Light snow ❄️', 73: 'Snow ❄️', 75: 'Heavy snow ❄️',
                    95: 'Thunderstorm ⛈️'
                };

                const { temperature_2m, weather_code, wind_speed_10m, relative_humidity_2m } = weather.current;
                const condition = conditions[weather_code] || 'Unknown';
                const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

                return `**${name}, ${country}**\n- ${condition}\n- Temperature: ${temperature_2m}${unitSymbol}\n- Humidity: ${relative_humidity_2m}%\n- Wind: ${wind_speed_10m} km/h`;
            } catch (e) {
                return `Error fetching weather: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },

    // -------------------------------------------------------------------------
    // SEARCH TOOL - Google News RSS + Wikipedia (reliable, free, no API key)
    // -------------------------------------------------------------------------
    {
        name: 'web_search',
        description: 'Search for information or news. Works for both factual queries and current news.',
        input_schema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query' },
                max_results: { type: 'number', description: 'Max results (1-5)', default: 3 }
            },
            required: ['query']
        },
        metadata: {
            source: 'Google News + Wikipedia',
            source_url: 'https://news.google.com'
        },
        execute: async ({ query, max_results = 3 }) => {
            const results: string[] = [];

            try {
                // Strategy 1: Google News RSS (for current events, news)
                try {
                    const newsRes = await fetchWithTimeout(
                        `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
                        {},
                        15000
                    );
                    const xml = await newsRes.text();

                    // Parse RSS XML
                    const items: { title: string; source: string; date: string; link: string }[] = [];
                    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                    let match;

                    while ((match = itemRegex.exec(xml)) !== null && items.length < max_results) {
                        const itemXml = match[1];
                        const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
                        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || '';
                        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || '';
                        const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1]?.trim() || '';

                        if (title && !title.includes('<?xml')) {
                            // Clean up HTML entities
                            const cleanTitle = title
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'");

                            items.push({
                                title: cleanTitle,
                                source,
                                date: pubDate ? new Date(pubDate).toLocaleDateString() : '',
                                link
                            });
                        }
                    }

                    for (const item of items) {
                        results.push(
                            `**${item.title}**\n_${item.source}${item.date ? ` • ${item.date}` : ''}_`
                        );
                    }
                } catch (e) {
                    console.error('News search error:', e);
                }

                // Strategy 2: Wikipedia (for factual/reference queries) - if news didn't work well
                if (results.length < 2) {
                    try {
                        // Try direct article lookup first
                        const wikiRes = await fetchWithTimeout(
                            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`,
                            {},
                            10000
                        );

                        if (wikiRes.ok) {
                            const wiki = await wikiRes.json();
                            if (wiki.extract && wiki.extract.length > 50) {
                                results.push(`**${wiki.title}** (Wikipedia)\n${wiki.extract.slice(0, 300)}${wiki.extract.length > 300 ? '...' : ''}`);
                            }
                        }
                    } catch {
                        // Try Wikipedia search API
                        try {
                            const searchRes = await fetchWithTimeout(
                                `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=${max_results}`,
                                {},
                                10000
                            );
                            const searchData = await searchRes.json();

                            for (const result of searchData.query?.search?.slice(0, max_results - results.length) || []) {
                                const snippet = result.snippet
                                    ?.replace(/<[^>]+>/g, '')
                                    ?.replace(/&quot;/g, '"')
                                    ?.replace(/&amp;/g, '&') || '';
                                results.push(`**${result.title}** (Wikipedia)\n${snippet}`);
                            }
                        } catch {
                            // Wikipedia search failed
                        }
                    }
                }

                // Strategy 3: DuckDuckGo Instant Answers (fallback for definitions)
                if (results.length === 0) {
                    try {
                        const ddgRes = await fetchWithTimeout(
                            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
                            {},
                            10000
                        );
                        const ddg = await ddgRes.json();

                        if (ddg.AbstractText) {
                            results.push(`**${ddg.Heading || query}**\n${ddg.AbstractText}`);
                        } else if (ddg.RelatedTopics?.length > 0) {
                            for (const topic of ddg.RelatedTopics.slice(0, max_results)) {
                                if (topic.Text) {
                                    results.push(`• ${topic.Text}`);
                                }
                            }
                        }
                    } catch {
                        // DDG failed
                    }
                }

                if (results.length === 0) {
                    return `No results found for "${query}". Try a different search term.`;
                }

                return `**Search: "${query}"**\n\n${results.slice(0, max_results).join('\n\n---\n\n')}`;
            } catch (e) {
                return `Search error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },

    // -------------------------------------------------------------------------
    // CALCULATOR TOOL
    // -------------------------------------------------------------------------
    {
        name: 'calculate',
        description: 'Perform mathematical calculations. Supports +, -, *, /, %, parentheses.',
        input_schema: {
            type: 'object',
            properties: {
                expression: { type: 'string', description: 'Math expression (e.g., "18/100*94.50")' }
            },
            required: ['expression']
        },
        metadata: {
            source: 'Math Engine',
        },
        execute: async ({ expression }) => {
            try {
                // Validate
                if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
                    return 'Error: Invalid characters. Only numbers and +, -, *, /, %, () allowed.';
                }

                const result = Function('"use strict"; return (' + expression + ')')();
                const formatted = typeof result === 'number'
                    ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(6)))
                    : result;

                return `\`${expression}\` = **${formatted}**`;
            } catch (e) {
                return `Calculation error: ${e instanceof Error ? e.message : 'Invalid expression'}`;
            }
        }
    },

    // -------------------------------------------------------------------------
    // TIME TOOL
    // -------------------------------------------------------------------------
    {
        name: 'get_time',
        description: 'Get the current date and time.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        },
        metadata: {
            source: 'System Clock',
        },
        execute: async () => {
            const now = new Date();
            const date = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const time = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            return `**${date}** at **${time}**`;
        }
    }
];

// Convert to Claude format
function getClaudeTools() {
    return TOOLS.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema
    }));
}

// Execute a tool by name
async function executeTool(name: string, args: Record<string, any>): Promise<{ result: string; metadata: MCPTool['metadata'] }> {
    const tool = TOOLS.find(t => t.name === name);
    if (!tool) {
        return { result: `Unknown tool: ${name}`, metadata: { source: 'Error' } };
    }
    const result = await tool.execute(args);
    return { result, metadata: tool.metadata };
}

// =============================================================================
// API HANDLER
// =============================================================================

/* SUNSET: Feature disabled
export async function POST(request: NextRequest) {
    if (!ANTHROPIC_API_KEY) {
        return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
        return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
            };

            try {
                const claudeTools = getClaudeTools();
                let messages: any[] = [{ role: 'user', content: message }];
                let iteration = 0;
                const maxIterations = 5;
                const executedTools = new Set<string>(); // Track executed tool calls to prevent duplicates

                while (iteration < maxIterations) {
                    iteration++;

                    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': ANTHROPIC_API_KEY,
                            'anthropic-version': '2023-06-01',
                        },
                        body: JSON.stringify({
                            model: 'claude-sonnet-4-20250514',
                            max_tokens: 1024,
                            system: `You are a helpful AI assistant with access to tools. Use each tool only ONCE per request - do not repeat tool calls. Be concise and use markdown formatting.`,
                            tools: claudeTools,
                            messages,
                        }),
                    }, 45000); // 45s timeout for LLM generation

                    if (!response.ok) {
                        throw new Error(`Claude API error: ${response.status}`);
                    }

                    const data = await response.json();

                    let hasToolUse = false;
                    const toolResults: any[] = [];

                    for (const block of data.content) {
                        if (block.type === 'text' && block.text) {
                            send({ type: 'text', content: block.text });
                        } else if (block.type === 'tool_use') {
                            // Create a signature to detect duplicate calls
                            const toolSignature = `${block.name}:${JSON.stringify(block.input)}`;

                            if (executedTools.has(toolSignature)) {
                                // Skip duplicate - just add a cached result
                                toolResults.push({
                                    type: 'tool_result',
                                    tool_use_id: block.id,
                                    content: '[Already executed - see previous result]'
                                });
                                continue;
                            }

                            executedTools.add(toolSignature);
                            hasToolUse = true;

                            send({
                                type: 'tool_call',
                                id: block.id,
                                tool: block.name,
                                args: block.input
                            });

                            // Execute tool
                            const { result, metadata } = await executeTool(block.name, block.input);

                            send({
                                type: 'tool_result',
                                id: block.id,
                                tool: block.name,
                                result,
                                source: metadata.source,
                                source_url: metadata.source_url
                            });

                            // SAFETY: Truncate large results
                            const safeResult = result.length > 2000
                                ? result.slice(0, 2000) + '... [TRUNCATED]'
                                : result;

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: block.id,
                                content: safeResult
                            });
                        }
                    }

                    if (hasToolUse && toolResults.length > 0) {
                        messages.push({ role: 'assistant', content: data.content });
                        messages.push({ role: 'user', content: toolResults });
                    } else {
                        break;
                    }

                    if (data.stop_reason === 'end_turn') break;
                }

                send({ type: 'complete' });

            } catch (error) {
                send({
                    type: 'error',
                    content: error instanceof Error ? error.message : 'Unknown error'
                });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
        },
    });
}

// =============================================================================
// GET - Health check / tool info
// =============================================================================

export async function GET() {
    return Response.json({
        status: 'ok',
        description: 'MCP-style agent with embedded tools',
        tools: TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            source: t.metadata.source
        })),
        note: 'Tools follow MCP schema patterns but execute in-process for zero-latency'
    });
}
*/

export async function POST(req: NextRequest) {
    return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 410 });
}

export async function GET() {
    return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 410 });
}
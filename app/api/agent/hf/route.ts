// app/api/agent/hf/route.ts
// Open Source Agent using HuggingFace Inference API
// Supports tool-calling with same NDJSON format as Claude endpoint

import { NextRequest } from 'next/server';

const HF_TOKEN = process.env.HF_API_TOKEN;

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

// Available models - instruction-tuned for best tool-calling
const MODELS = {
    'qwen': 'Qwen/Qwen2.5-72B-Instruct',
    'llama': 'meta-llama/Llama-3.3-70B-Instruct',
    'deepseek': 'deepseek-ai/DeepSeek-R1',
} as const;

const DEFAULT_MODEL = 'qwen';

// =============================================================================
// TOOLS - Same as Claude version
// =============================================================================

interface Tool {
    name: string;
    description: string;
    parameters: string[];
    execute: (args: Record<string, string>) => Promise<string>;
    metadata: { source: string; source_url: string };
}

const TOOLS: Tool[] = [
    {
        name: 'get_weather',
        description: 'Get current weather for a city',
        parameters: ['city', 'unit (optional: celsius/fahrenheit)'],
        metadata: { source: 'Open-Meteo API', source_url: 'https://open-meteo.com' },
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
                    return `No weather data for ${name}`;
                }

                const conditions: Record<number, string> = {
                    0: 'Clear sky ☀️', 1: 'Mainly clear 🌤️', 2: 'Partly cloudy ⛅', 3: 'Overcast ☁️',
                    45: 'Foggy 🌫️', 48: 'Rime fog 🌫️', 51: 'Light drizzle 🌧️', 53: 'Drizzle 🌧️',
                    55: 'Dense drizzle 🌧️', 61: 'Slight rain 🌧️', 63: 'Rain 🌧️', 65: 'Heavy rain 🌧️',
                    71: 'Light snow ❄️', 73: 'Snow ❄️', 75: 'Heavy snow ❄️', 95: 'Thunderstorm ⛈️'
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
    {
        name: 'web_search',
        description: 'Search for news and information',
        parameters: ['query'],
        metadata: { source: 'Google News + Wikipedia', source_url: 'https://news.google.com' },
        execute: async ({ query }) => {
            const results: string[] = [];
            const maxResults = 3;

            try {
                // Google News RSS
                try {
                    const newsRes = await fetchWithTimeout(
                        `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
                        {},
                        15000
                    );
                    const xml = await newsRes.text();

                    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                    let match;
                    let count = 0;

                    while ((match = itemRegex.exec(xml)) !== null && count < maxResults) {
                        const itemXml = match[1];
                        const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
                        const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1]?.trim() || '';

                        if (title && !title.includes('<?xml')) {
                            const cleanTitle = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                            results.push(`**${cleanTitle}**\n_${source}_`);
                            count++;
                        }
                    }
                } catch { }

                // Wikipedia fallback
                if (results.length < 2) {
                    try {
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
                    } catch { }
                }

                return results.length > 0
                    ? `**Search: "${query}"**\n\n${results.join('\n\n---\n\n')}`
                    : `No results found for "${query}"`;
            } catch (e) {
                return `Search error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },
    {
        name: 'calculate',
        description: 'Perform math calculations',
        parameters: ['expression'],
        metadata: { source: 'Math Engine', source_url: '' },
        execute: async ({ expression }) => {
            try {
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
    {
        name: 'get_time',
        description: 'Get current date and time',
        parameters: [],
        metadata: { source: 'Server Clock', source_url: '' },
        execute: async () => {
            const now = new Date();
            const date = now.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const time = now.toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit', hour12: true
            });
            return `**${date}** at **${time}**`;
        }
    }
];

// =============================================================================
// PROMPT CONSTRUCTION
// =============================================================================

function buildSystemPrompt(): string {
    const toolDescriptions = TOOLS.map(t =>
        `- ${t.name}(${t.parameters.join(', ')}): ${t.description}`
    ).join('\n');

    return `You are a helpful AI assistant with access to tools.

AVAILABLE TOOLS:
${toolDescriptions}

TOOL CALLING FORMAT:
When you need to use a tool, respond with EXACTLY this format on its own line:
<tool>tool_name|param1=value1|param2=value2</tool>

Examples:
<tool>get_weather|city=Tokyo</tool>
<tool>web_search|query=latest AI news</tool>
<tool>calculate|expression=18/100*94.50</tool>
<tool>get_time</tool>

RULES:
1. Use tools when needed to get real data
2. After receiving tool results, provide a helpful response
3. Be concise and use markdown formatting
4. Only use ONE tool at a time
5. Do not make up data - use tools to get real information`;
}

function parseToolCall(text: string): { tool: string; args: Record<string, string> } | null {
    const match = text.match(/<tool>([^<]+)<\/tool>/);
    if (!match) return null;

    const parts = match[1].split('|');
    const toolName = parts[0].trim();
    const args: Record<string, string> = {};

    for (let i = 1; i < parts.length; i++) {
        const [key, ...valueParts] = parts[i].split('=');
        if (key && valueParts.length > 0) {
            args[key.trim()] = valueParts.join('=').trim();
        }
    }

    return { tool: toolName, args };
}

// =============================================================================
// API HANDLER
// =============================================================================

/* SUNSET: Feature disabled
export async function POST(request: NextRequest) {
    if (!HF_TOKEN) {
        return Response.json({ error: 'HF_API_TOKEN not configured' }, { status: 500 });
    }

    const { message, model = DEFAULT_MODEL } = await request.json();

    if (!message?.trim()) {
        return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const modelId = MODELS[model as keyof typeof MODELS] || MODELS[DEFAULT_MODEL];
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
            };

            try {
                const systemPrompt = buildSystemPrompt();
                let conversationHistory = [
                    { role: 'user', content: message }
                ];
                let iteration = 0;
                const maxIterations = 3;

                while (iteration < maxIterations) {
                    iteration++;

                    // Call HuggingFace
                    const response = await fetchWithTimeout('https://router.huggingface.co/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${HF_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: modelId,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                ...conversationHistory
                            ],
                            max_tokens: 1000,
                            temperature: 0.7,
                            stream: false, // Non-streaming for tool parsing
                        }),
                    }, 45000);

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    const assistantMessage = data.choices?.[0]?.message?.content || '';

                    // Check for tool call
                    const toolCall = parseToolCall(assistantMessage);

                    if (toolCall) {
                        const tool = TOOLS.find(t => t.name === toolCall.tool);

                        if (tool) {
                            // Send tool call event
                            const toolId = `tool-${Date.now()}`;
                            send({
                                type: 'tool_call',
                                id: toolId,
                                tool: tool.name,
                                args: toolCall.args
                            });

                            // Execute tool
                            const rawResult = await tool.execute(toolCall.args);

                            // SAFETY: Truncate large results
                            const result = rawResult.length > 2000
                                ? rawResult.slice(0, 2000) + '... [TRUNCATED]'
                                : rawResult;

                            // Send tool result event
                            send({
                                type: 'tool_result',
                                id: toolId,
                                tool: tool.name,
                                result,
                                source: tool.metadata.source,
                                source_url: tool.metadata.source_url
                            });

                            // Add to conversation history for next iteration
                            conversationHistory.push(
                                { role: 'assistant', content: assistantMessage },
                                { role: 'user', content: `Tool result for ${tool.name}:\n${result}\n\nNow provide a helpful response based on this data.` }
                            );

                            // Continue loop to get final response
                            continue;
                        }
                    }

                    // No tool call - this is the final response
                    // Clean any partial tool tags from response
                    const cleanResponse = assistantMessage
                        .replace(/<tool>[^<]*<\/tool>/g, '')
                        .trim();

                    if (cleanResponse) {
                        send({ type: 'text', content: cleanResponse });
                    }

                    break; // Exit loop
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
// GET - Health check / info
// =============================================================================

export async function GET() {
    return Response.json({
        status: HF_TOKEN ? 'ok' : 'missing_token',
        description: 'Open Source Agent via HuggingFace Inference API',
        models: Object.entries(MODELS).map(([key, id]) => ({ key, id })),
        default_model: DEFAULT_MODEL,
        tools: TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            source: t.metadata.source
        }))
    });
}
*/

export async function POST(req: NextRequest) {
    return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 410 });
}

export async function GET() {
    return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 410 });
}
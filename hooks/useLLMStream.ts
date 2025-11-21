import { useState, useCallback } from 'react';

interface GenerationRequest {
    prompt: string;
    model_id?: string;
    max_new_tokens?: number;
    temperature?: number;
    top_k?: number;
    top_p?: number;
    strategy?: string;
}

interface UseLLMStreamResult {
    streamGenerate: (request: GenerationRequest) => Promise<string>;
    streamingText: string;
    isLoading: boolean;
    error: string | null;
    abort: () => void;
}

export function useLLMStream(): UseLLMStreamResult {
    const [streamingText, setStreamingText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const abort = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setIsLoading(false);
        }
    }, [abortController]);

    const streamGenerate = useCallback(async (request: GenerationRequest) => {
        // Reset state
        setStreamingText('');
        setError(null);
        setIsLoading(true);

        // Create new abort controller
        const controller = new AbortController();
        setAbortController(controller);

        let fullText = '';

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
            const response = await fetch(`${baseUrl}/llm/generate_stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (data.token) {
                            fullText += data.token;
                            setStreamingText((prev) => prev + data.token);
                        }
                    } catch (e) {
                        console.warn('Error parsing JSON chunk:', e);
                    }
                }
            }

            return fullText;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Generation aborted');
                return fullText; // Return what we have so far
            } else {
                setError(err.message || 'An error occurred during generation');
                console.error('Streaming error:', err);
                throw err; // Re-throw the error for the caller to handle if needed
            }
        } finally {
            setIsLoading(false);
            setAbortController(null);
        }
    }, []);

    return {
        streamGenerate,
        streamingText,
        isLoading,
        error,
        abort,
    };
}

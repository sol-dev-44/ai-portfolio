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
            // Use non-streaming endpoint for production stability
            const response = await fetch(`${baseUrl}/llm/generate`, {
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

            const data = await response.json();
            fullText = data.text;
            setStreamingText(fullText);

            return fullText;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Generation aborted');
                return fullText;
            } else {
                setError(err.message || 'An error occurred during generation');
                console.error('Generation error:', err);
                throw err;
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

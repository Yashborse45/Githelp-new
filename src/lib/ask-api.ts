import { useState } from 'react';

export type Citation = {
    path: string;
    chunkIndex: number;
    excerpt?: string;
};

export type AskResponse = {
    success: true;
    data: {
        id: string;
        question: string;
        answer: string;
        citations: Citation[];
        createdAt: string;
    };
} | {
    success: false;
    error: string;
};

export type QAHistoryResponse = {
    success: true;
    data: Array<{
        id: string;
        question: string;
        answer: string;
        citations: Citation[];
        createdAt: string;
    }>;
} | {
    success: false;
    error: string;
};

/**
 * Ask a question about a specific project
 */
export async function askQuestion(
    projectId: string,
    question: string
): Promise<AskResponse> {
    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId,
                question: question.trim(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP ${response.status}`,
            };
        }

        return data;
    } catch (error) {
        console.error('Error asking question:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Get Q&A history for a project
 */
export async function getQAHistory(projectId: string): Promise<QAHistoryResponse> {
    try {
        const response = await fetch(`/api/ask?projectId=${encodeURIComponent(projectId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP ${response.status}`,
            };
        }

        return data;
    } catch (error) {
        console.error('Error fetching Q&A history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Hook for React components to ask questions
 */
export function useAskQuestion() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ask = async (projectId: string, question: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await askQuestion(projectId, question);

            if (!result.success) {
                setError(result.error);
                return null;
            }

            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { ask, isLoading, error };
}
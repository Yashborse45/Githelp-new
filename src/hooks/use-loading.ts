import { useState } from 'react';

export interface LoadingState {
    isLoading: boolean;
    progress?: number;
    message?: string;
    stage?: string;
}

export function useLoadingState(initialState: LoadingState = { isLoading: false }) {
    const [loadingState, setLoadingState] = useState<LoadingState>(initialState);

    const startLoading = (message?: string, stage?: string) => {
        setLoadingState({
            isLoading: true,
            progress: 0,
            message: message || 'Loading...',
            stage,
        });
    };

    const updateProgress = (progress: number, message?: string, stage?: string) => {
        setLoadingState(prev => ({
            ...prev,
            progress: Math.min(100, Math.max(0, progress)),
            message: message || prev.message,
            stage: stage || prev.stage,
        }));
    };

    const setMessage = (message: string, stage?: string) => {
        setLoadingState(prev => ({
            ...prev,
            message,
            stage: stage || prev.stage,
        }));
    };

    const finishLoading = () => {
        setLoadingState({
            isLoading: false,
            progress: 100,
            message: undefined,
            stage: undefined,
        });
    };

    const resetLoading = () => {
        setLoadingState({
            isLoading: false,
            progress: 0,
            message: undefined,
            stage: undefined,
        });
    };

    return {
        loadingState,
        startLoading,
        updateProgress,
        setMessage,
        finishLoading,
        resetLoading,
    };
}

export function useAsyncOperation<T = any>() {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { loadingState, startLoading, updateProgress, setMessage, finishLoading, resetLoading } = useLoadingState();

    const execute = async (
        operation: () => Promise<T>,
        options?: {
            loadingMessage?: string;
            successMessage?: string;
            onProgress?: (progress: number, message?: string) => void;
        }
    ) => {
        try {
            setError(null);
            startLoading(options?.loadingMessage || 'Processing...');

            const result = await operation();

            setData(result);
            setMessage(options?.successMessage || 'Operation completed successfully!');

            // Brief delay to show success message
            setTimeout(() => {
                finishLoading();
            }, 1000);

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            finishLoading();
            throw err;
        }
    };

    const reset = () => {
        setData(null);
        setError(null);
        resetLoading();
    };

    return {
        data,
        error,
        loadingState,
        execute,
        reset,
        updateProgress,
        setMessage,
    };
}
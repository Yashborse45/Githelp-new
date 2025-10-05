import { useToast } from '@/hooks/use-toast';
import { useCallback, useState } from 'react';

export interface ErrorInfo {
    message: string;
    code?: string;
    details?: any;
    timestamp: Date;
    recoverable?: boolean;
    retryCount?: number;
}

export interface ErrorHandlerOptions {
    showToast?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: () => void;
}

export function useErrorHandler() {
    const [errors, setErrors] = useState<ErrorInfo[]>([]);
    const { toast } = useToast();

    const handleError = useCallback(
        (error: any, options: ErrorHandlerOptions = {}) => {
            const {
                showToast = true,
                autoRetry = false,
                maxRetries = 3,
                retryDelay = 1000,
                onRetry,
            } = options;

            const errorInfo: ErrorInfo = {
                message: error instanceof Error ? error.message : String(error),
                code: error?.code || error?.status?.toString(),
                details: error?.details || error?.response?.data,
                timestamp: new Date(),
                recoverable: isRecoverableError(error),
                retryCount: 0,
            };

            setErrors(prev => [errorInfo, ...prev.slice(0, 9)]); // Keep last 10 errors

            if (showToast) {
                toast({
                    title: 'Error Occurred',
                    description: getErrorMessage(errorInfo),
                    variant: 'destructive',
                });
            }

            if (autoRetry && errorInfo.recoverable && onRetry) {
                setTimeout(() => {
                    if (errorInfo.retryCount! < maxRetries) {
                        errorInfo.retryCount = (errorInfo.retryCount || 0) + 1;
                        onRetry();
                    }
                }, retryDelay);
            }

            return errorInfo;
        },
        [toast]
    );

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const removeError = useCallback((timestamp: Date) => {
        setErrors(prev => prev.filter(error => error.timestamp !== timestamp));
    }, []);

    return {
        errors,
        handleError,
        clearErrors,
        removeError,
    };
}

function isRecoverableError(error: any): boolean {
    if (!error) return false;

    const status = error?.status || error?.response?.status;
    const code = error?.code;

    // Network errors are often recoverable
    if (code === 'NETWORK_ERROR' || code === 'TIMEOUT') return true;

    // 5xx server errors are often recoverable
    if (status >= 500 && status < 600) return true;

    // Rate limiting is recoverable
    if (status === 429) return true;

    // 4xx client errors are usually not recoverable
    if (status >= 400 && status < 500) return false;

    return false;
}

function getErrorMessage(errorInfo: ErrorInfo): string {
    const { message, code, recoverable } = errorInfo;

    let userMessage = message;

    // Provide user-friendly messages for common errors
    if (code === 'NETWORK_ERROR') {
        userMessage = 'Network connection issue. Please check your internet connection.';
    } else if (code === '401') {
        userMessage = 'Authentication required. Please sign in again.';
    } else if (code === '403') {
        userMessage = 'Access denied. You may not have permission for this action.';
    } else if (code === '404') {
        userMessage = 'The requested resource was not found.';
    } else if (code === '429') {
        userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (code === '500') {
        userMessage = 'Server error. Our team has been notified.';
    }

    if (recoverable) {
        userMessage += ' This error may be temporary.';
    }

    return userMessage;
}
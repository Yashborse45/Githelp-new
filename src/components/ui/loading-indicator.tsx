"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type LoadingState } from '@/hooks/use-loading';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface LoadingIndicatorProps {
    loadingState: LoadingState;
    showProgress?: boolean;
    showMessage?: boolean;
    compact?: boolean;
    className?: string;
}

export function LoadingIndicator({
    loadingState,
    showProgress = true,
    showMessage = true,
    compact = false,
    className = "",
}: LoadingIndicatorProps) {
    const { isLoading, progress, message, stage } = loadingState;

    if (!isLoading) return null;

    if (compact) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {showMessage && message && (
                    <span className="text-sm text-muted-foreground">{message}</span>
                )}
            </div>
        );
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div className="flex-1">
                            {showMessage && message && (
                                <p className="text-sm font-medium">{message}</p>
                            )}
                            {stage && (
                                <p className="text-xs text-muted-foreground">{stage}</p>
                            )}
                        </div>
                    </div>

                    {showProgress && progress !== undefined && (
                        <div className="space-y-2">
                            <Progress value={progress} className="w-full" />
                            <p className="text-xs text-muted-foreground text-right">
                                {Math.round(progress)}% complete
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface AsyncOperationStateProps {
    data: any;
    error: string | null;
    loadingState: LoadingState;
    onRetry?: () => void;
    successMessage?: string;
    children: (data: any) => React.ReactNode;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
}

export function AsyncOperationState({
    data,
    error,
    loadingState,
    onRetry,
    successMessage,
    children,
    loadingComponent,
    errorComponent,
}: AsyncOperationStateProps) {
    // Loading state
    if (loadingState.isLoading) {
        return loadingComponent || <LoadingIndicator loadingState={loadingState} />;
    }

    // Error state
    if (error) {
        return (
            errorComponent || (
                <Card className="w-full border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-destructive mb-1">
                                    Something went wrong
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3">{error}</p>
                                {onRetry && (
                                    <Button size="sm" variant="outline" onClick={onRetry}>
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Try Again
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        );
    }

    // Success state with data
    if (data) {
        return (
            <div>
                {successMessage && (
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                        <CheckCircle className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}
                {children(data)}
            </div>
        );
    }

    // Empty state
    return (
        <Card className="w-full">
            <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No data available</p>
            </CardContent>
        </Card>
    );
}

// Pre-built loading states for common operations
export const LoadingStates = {
    Thinking: {
        isLoading: true,
        message: "AI is thinking...",
        stage: "Processing your request",
    },
    Processing: {
        isLoading: true,
        message: "Processing...",
        progress: 50,
    },
    Uploading: {
        isLoading: true,
        message: "Uploading files...",
        stage: "Please wait while we process your data",
    },
    Analyzing: {
        isLoading: true,
        message: "Analyzing repository...",
        stage: "This may take a few moments",
    },
    Saving: {
        isLoading: true,
        message: "Saving changes...",
        progress: 80,
    },
};
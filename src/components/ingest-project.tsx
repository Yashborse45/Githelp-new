'use client';

import { useLoadingState } from '@/hooks/use-loading';
import { api } from '@/trpc/react';
import { CheckCircle, Database, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ErrorDisplay } from './ui/error-display';
import { LoadingIndicator } from './ui/loading-indicator';

interface IngestProjectProps {
    projectId: string;
}

export default function IngestProject({ projectId }: IngestProjectProps) {
    const [ingestResult, setIngestResult] = useState<{ totalFiles: number; processedFiles: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { loadingState, startLoading, updateProgress, setMessage, finishLoading } = useLoadingState();

    const ingestMutation = api.project.ingest.useMutation({
        onSuccess: (result) => {
            setIngestResult(result);
            setMessage('Repository processing completed successfully!');
            setTimeout(() => {
                finishLoading();
                setError(null);
            }, 1500);
        },
        onError: (error) => {
            setError(error.message);
            finishLoading();
        },
    });

    const handleIngest = async () => {
        setError(null);
        setIngestResult(null);
        startLoading('Initializing repository analysis...', 'Connecting to repository');

        // Simulate progress updates
        setTimeout(() => updateProgress(20, 'Fetching repository contents...', 'Reading files'), 500);
        setTimeout(() => updateProgress(40, 'Processing code files...', 'Analyzing structure'), 1500);
        setTimeout(() => updateProgress(60, 'Generating embeddings...', 'AI processing'), 3000);
        setTimeout(() => updateProgress(80, 'Storing in knowledge base...', 'Finalizing'), 4500);

        try {
            await ingestMutation.mutateAsync({ projectId });
        } catch (err) {
            // Error is handled in onError callback
        }
    };

    const handleRetry = () => {
        handleIngest();
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Repository Knowledge Base
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Process your repository code to enable context-aware Q&A. This will analyze your code files and create embeddings for semantic search.
                </p>

                {error && (
                    <ErrorDisplay
                        error={error}
                        onRetry={handleRetry}
                        variant="alert"
                        retryLabel="Retry Processing"
                    />
                )}

                {ingestResult && !loadingState.isLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">
                            Successfully processed {ingestResult.processedFiles} of {ingestResult.totalFiles} files
                        </span>
                    </div>
                )}

                {loadingState.isLoading && (
                    <LoadingIndicator
                        loadingState={loadingState}
                        showProgress={true}
                        showMessage={true}
                        compact={false}
                    />
                )}

                <Button
                    onClick={handleIngest}
                    disabled={loadingState.isLoading || ingestMutation.isPending}
                    className="w-full"
                >
                    {loadingState.isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Database className="mr-2 h-4 w-4" />
                            {ingestResult ? 'Re-process Repository' : 'Process Repository'}
                        </>
                    )}
                </Button>

                <p className="text-xs text-muted-foreground">
                    This process analyzes your code files and creates semantic embeddings.
                    Large repositories may take a few minutes to process.
                </p>
            </CardContent>
        </Card>
    );
}
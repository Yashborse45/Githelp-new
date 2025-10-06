'use client';

import { useLoadingState } from '@/hooks/use-loading';
import { api } from '@/trpc/react';
import { CheckCircle, Database, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ErrorDisplay } from './ui/error-display';
import { LoadingIndicator } from './ui/loading-indicator';

interface IngestProjectProps {
    projectId: string;
}

export default function IngestProject({ projectId }: IngestProjectProps) {
    const [ingestResult, setIngestResult] = useState<{ totalFiles: number; processedFiles: number } | null>(null);
    const [repoInfo, setRepoInfo] = useState<{ totalFiles: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { loadingState, startLoading, updateProgress, setMessage, finishLoading } = useLoadingState();

    // Get repository info for better time estimates
    const getTimeEstimate = (totalFiles: number): string => {
        if (totalFiles < 50) return "1-2 minutes ☕"
        if (totalFiles < 200) return "3-5 minutes ☕☕"
        if (totalFiles < 500) return "5-10 minutes ☕☕☕"
        return "10-15 minutes - perfect time for a coffee break! ☕☕☕☕"
    }

    // Query to get repository plan
    const { data: planData } = api.project.ingestPlan.useQuery(
        { projectId },
        {
            enabled: !ingestResult // Only fetch if not already processed
        }
    );

    // Update repo info when plan data is available
    useEffect(() => {
        if (planData) {
            setRepoInfo(planData);
        }
    }, [planData]);

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

        const timeEstimate = repoInfo ? getTimeEstimate(repoInfo.totalFiles) : "a few minutes";
        startLoading('Initializing repository analysis...', `Estimated time: ${timeEstimate}`);

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
                    Your repository will be analyzed to enable intelligent Q&A. This creates a knowledge base from your code for context-aware assistance.
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
                    {repoInfo ? (
                        <>
                            Found {repoInfo.totalFiles} files to analyze.
                            Estimated time: {getTimeEstimate(repoInfo.totalFiles)}
                        </>
                    ) : (
                        <>Analysis time varies by repository size: Small repos (1-2 min), Medium repos (3-5 min), Large repos (5-10 min).</>
                    )}
                </p>
            </CardContent>
        </Card>
    );
}
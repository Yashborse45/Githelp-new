import { Pinecone } from "@pinecone-database/pinecone";
import {
    CircuitBreaker,
    PineconeError,
    RateLimiter,
    safeExecute,
    withRetry,
    withTimeout
} from "../lib/error-handling";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "githelp";

// Create pinecone instance only if API key is available
let pinecone: Pinecone | null = null;

// Circuit breaker for Pinecone operations
const pineconeCircuitBreaker = new CircuitBreaker(3, 30000);
const pineconeRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Handles Pinecone API errors with proper error classification
 */
function handlePineconeError(error: unknown, context: string): never {
    if (error && typeof error === 'object' && 'status' in error) {
        const pineconeError = error as { status: number; message?: string };

        switch (pineconeError.status) {
            case 401:
                throw new PineconeError(
                    'Pinecone authentication failed. Please check your API key.',
                    'UNAUTHORIZED',
                    401,
                    error
                );
            case 403:
                throw new PineconeError(
                    'Pinecone access forbidden. Check your permissions.',
                    'FORBIDDEN',
                    403,
                    error
                );
            case 404:
                throw new PineconeError(
                    'Pinecone index not found.',
                    'INDEX_NOT_FOUND',
                    404,
                    error
                );
            case 429:
                throw new PineconeError(
                    'Pinecone rate limit exceeded.',
                    'RATE_LIMITED',
                    429,
                    error
                );
            case 500:
            case 502:
            case 503:
            case 504:
                throw new PineconeError(
                    'Pinecone service temporarily unavailable.',
                    'SERVICE_UNAVAILABLE',
                    pineconeError.status,
                    error
                );
            default:
                throw new PineconeError(
                    `Pinecone API error in ${context}: ${pineconeError.message || 'Unknown error'}`,
                    'API_ERROR',
                    pineconeError.status,
                    error
                );
        }
    }

    if (error instanceof Error) {
        throw new PineconeError(
            `Pinecone operation failed in ${context}: ${error.message}`,
            'OPERATION_ERROR',
            undefined,
            error
        );
    }

    throw new PineconeError(
        `Unknown Pinecone error in ${context}`,
        'UNKNOWN_ERROR',
        undefined,
        error
    );
}

export async function getPineconeClient(): Promise<Pinecone> {
    if (!PINECONE_API_KEY) {
        throw new PineconeError(
            "PINECONE_API_KEY is required but not set in environment variables",
            'MISSING_API_KEY'
        );
    }

    if (!pinecone) {
        try {
            pinecone = new Pinecone({
                apiKey: PINECONE_API_KEY,
            });

            // Test the connection with a simple operation
            await withTimeout(async () => {
                await pinecone!.listIndexes();
            }, 10000, 'Pinecone connection timeout');

        } catch (error) {
            pinecone = null;
            handlePineconeError(error, 'client initialization');
        }
    }

    return pinecone;
}

export async function upsertVectors(vectors: { id: string; values: number[]; metadata?: any }[]): Promise<void> {
    if (!vectors || vectors.length === 0) {
        console.warn('No vectors provided for upsert');
        return;
    }

    // Validate vector data
    for (const vector of vectors) {
        if (!vector.id || !vector.values || !Array.isArray(vector.values)) {
            throw new PineconeError(
                'Invalid vector format: id and values array are required',
                'INVALID_VECTOR_FORMAT'
            );
        }
    }

    return pineconeCircuitBreaker.execute(async () => {
        await pineconeRateLimiter.checkLimit();

        return withRetry(async () => {
            return withTimeout(async () => {
                try {
                    const pc = await getPineconeClient();
                    const index = pc.index(PINECONE_INDEX);

                    const batch = 100;
                    for (let i = 0; i < vectors.length; i += batch) {
                        const chunk = vectors.slice(i, i + batch);

                        await safeExecute(async () => {
                            await index.upsert(chunk);
                        }, undefined, `vector upsert batch ${i / batch + 1}`);

                        // Small delay between batches
                        if (i + batch < vectors.length) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }

                    console.log(`Successfully upserted ${vectors.length} vectors to Pinecone`);
                } catch (error) {
                    handlePineconeError(error, 'upsertVectors');
                }
            }, 30000, 'Pinecone upsert operation timed out');
        }, {
            maxRetries: 3,
            retryCondition: (error) => {
                if (error instanceof PineconeError) {
                    // Don't retry on authentication or invalid format errors
                    return error.code !== 'UNAUTHORIZED' && error.code !== 'INVALID_VECTOR_FORMAT';
                }
                return true;
            }
        });
    });
}

export async function queryVectors(vector: number[], topK = 5, projectId?: string): Promise<any[]> {
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new PineconeError(
            'Invalid query vector: must be a non-empty array',
            'INVALID_QUERY_VECTOR'
        );
    }

    if (topK < 1 || topK > 10000) {
        throw new PineconeError(
            'topK must be between 1 and 10000',
            'INVALID_TOP_K'
        );
    }

    return pineconeCircuitBreaker.execute(async () => {
        await pineconeRateLimiter.checkLimit();

        return withRetry(async () => {
            return withTimeout(async () => {
                try {
                    const pc = await getPineconeClient();
                    const index = pc.index(PINECONE_INDEX);

                    const queryOptions: any = {
                        vector,
                        topK,
                        includeMetadata: true,
                    };

                    // Filter by project ID if provided
                    if (projectId) {
                        queryOptions.filter = { projectId };
                    }

                    const result = await index.query(queryOptions);

                    if (!result.matches) {
                        console.warn('No matches returned from Pinecone query');
                        return [];
                    }

                    console.log(`Pinecone query returned ${result.matches.length} matches`);
                    return result.matches;
                } catch (error) {
                    handlePineconeError(error, 'queryVectors');
                }
            }, 15000, 'Pinecone query operation timed out');
        }, {
            maxRetries: 2,
            retryCondition: (error) => {
                if (error instanceof PineconeError) {
                    // Don't retry on authentication or invalid vector errors
                    return error.code !== 'UNAUTHORIZED' && error.code !== 'INVALID_QUERY_VECTOR';
                }
                return true;
            }
        });
    });
}

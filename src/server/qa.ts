export type Citation = { path: string; chunkIndex: number; excerpt?: string };

export interface QAResult {
    answer: string;
    citations: Citation[];
    success: boolean;
    error?: string;
}

// Simple error class for service operations
class ServiceError extends Error {
    public readonly service: string;
    public readonly code: string;

    constructor(message: string, service: string, code: string, statusCode?: number, cause?: unknown) {
        super(message);
        this.name = 'ServiceError';
        this.service = service;
        this.code = code;
        this.cause = cause;
    }
}

/**
 * Answer a question using RAG (Retrieval-Augmented Generation)
 */
export async function answerQuestion(projectId: string, question: string): Promise<QAResult> {
    // Input validation
    if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
        return {
            answer: "Invalid project ID provided.",
            citations: [],
            success: false,
            error: "INVALID_PROJECT_ID"
        };
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return {
            answer: "Please provide a valid question.",
            citations: [],
            success: false,
            error: "INVALID_QUESTION"
        };
    }

    // Early return if required environment variables are not set
    if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
        return {
            answer: "AI features are not configured. Please set PINECONE_API_KEY and GEMINI_API_KEY environment variables.",
            citations: [],
            success: false,
            error: "MISSING_API_KEYS"
        };
    }

    try {
        // Set a timeout for the entire operation
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('QA operation timed out')), 90000)
        );

        const operationPromise = (async () => {
            let retries = 2;

            while (retries >= 0) {
                try {
                    // Dynamic imports to avoid module loading issues
                    const { chatCompletion, embedTexts } = await import("./gemini");
                    const { queryVectors } = await import("./pinecone");

                    console.log(`Processing question for project ${projectId}: ${question.substring(0, 100)}...`);

                    // 1. RETRIEVAL STEP 1: Get the query vector (embedding for the question)
                    let qEmbedding;
                    try {
                        const embeddings = await embedTexts([question.trim()]);
                        if (!embeddings || embeddings.length === 0) {
                            throw new Error("Failed to generate embedding for question");
                        }
                        qEmbedding = embeddings[0];
                    } catch (error) {
                        console.error('Question embedding failed:', error);
                        throw new ServiceError("Failed to generate embedding for question", "QA", "EMBEDDING_FAILED");
                    }

                    if (!qEmbedding) {
                        throw new ServiceError("Failed to generate embedding for question", "QA", "EMBEDDING_FAILED");
                    }

                    // 2. RETRIEVAL STEP 2: Perform similarity search to find top 5 relevant code chunks (reduced from 10 for faster responses)
                    let queryResp: any;
                    try {
                        queryResp = await queryVectors(qEmbedding, 5, projectId);
                    } catch (error) {
                        console.error('Vector similarity search failed:', error);
                        queryResp = { matches: [] };
                    }

                    const matches = (Array.isArray(queryResp) ? queryResp : (queryResp as any).matches || [])
                        .filter((m: any) => m.score && m.score > 0.6) // Increased threshold to 0.6 for more relevant results
                        .slice(0, 5) // Limit to top 5 matches
                        .map((m: any) => ({ id: m.id, score: m.score, metadata: m.metadata }));

                    // 3. AUGMENTATION STEP: Construct optimized context string from retrieved code chunks
                    let context = "";
                    const fileReferences: Citation[] = [];

                    if (matches.length > 0) {
                        for (const match of matches) {
                            const metadata = match.metadata;
                            if (metadata?.path && metadata?.text) {
                                // Add concise structured context for each relevant code chunk
                                const codeSnippet = metadata.text.length > 1000
                                    ? metadata.text.slice(0, 1000) + '...[truncated]'
                                    : metadata.text;

                                context += `File: ${metadata.path}\n`;
                                context += `Code:\n${codeSnippet}\n`;
                                context += `Relevance: ${(match.score * 100).toFixed(0)}%\n\n`;

                                // Track file references for citations (use full text for display)
                                fileReferences.push({
                                    path: metadata.path,
                                    chunkIndex: metadata.chunkIndex || 0,
                                    excerpt: metadata.text
                                });
                            }
                        }
                    }

                    // 4. GENERATION STEP: Generate answer using enhanced prompt with streaming
                    const prompt = matches.length === 0
                        ? `You are an expert software engineer and code assistant with deep technical knowledge. The user is asking: "${question}".

Provide a clear, practical response about software development. Include specific examples and actionable steps.

Note: For specific answers about their codebase, they should ingest their project code first.`
                        : `You are an expert software engineer and AI code assistant with deep knowledge of software architecture, design patterns, and best practices.

You have access to the user's actual codebase. Analyze it carefully and provide expert-level insights.

Code Context from Repository:
${context}

User Question: ${question}

Instructions:
- Analyze the code like an experienced software engineer
- Reference specific files, functions, and patterns
- Explain technical concepts clearly
- Provide actionable, professional guidance
- Suggest improvements based on industry best practices

Provide your expert analysis:`;

                    let answerText;
                    try {
                        answerText = await chatCompletion(prompt, 1000);
                    } catch (error) {
                        console.error('Answer generation failed:', error);
                        answerText = "I'm having trouble generating a response right now. Please try again in a moment.";
                    }

                    const citations: Citation[] = fileReferences.slice(0, 5); // Limit to top 5 for UI

                    console.log(`Successfully answered question for project ${projectId}`);
                    return {
                        answer: answerText,
                        citations,
                        success: true
                    };
                } catch (error) {
                    retries--;
                    console.error('QA operation failed:', error);

                    if (retries < 0) {
                        // Provide a more helpful error message based on the error type
                        let errorMessage = "Sorry, I encountered an error while trying to answer your question.";
                        let errorCode = "UNKNOWN_ERROR";

                        if (error instanceof ServiceError) {
                            errorCode = error.code || "SERVICE_ERROR";
                            switch (error.service) {
                                case 'Gemini':
                                    errorMessage = "I'm having trouble processing your question with AI. Please check your Gemini API configuration.";
                                    break;
                                case 'Pinecone':
                                    errorMessage = "I can't search through your project code right now. Please check your Pinecone configuration.";
                                    break;
                                default:
                                    errorMessage = `Service error: ${error.message}`;
                            }
                        } else if (error instanceof Error) {
                            if (error.message.includes("embed")) {
                                errorMessage = "I'm having trouble processing your question. Please check that your Gemini API key is correctly configured.";
                                errorCode = "EMBEDDING_ERROR";
                            } else if (error.message.includes("Pinecone")) {
                                errorMessage = "I can't search through your project code right now. Please check your Pinecone configuration.";
                                errorCode = "VECTOR_SEARCH_ERROR";
                            } else if (error.message.includes("chat")) {
                                errorMessage = "I'm having trouble generating a response. Please try again in a moment.";
                                errorCode = "CHAT_ERROR";
                            }
                        }

                        throw new ServiceError(
                            errorMessage + " If this problem persists, please check your AI service configurations.",
                            "QA",
                            errorCode,
                            undefined,
                            error
                        );
                    }

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        })();

        return await Promise.race([operationPromise, timeoutPromise]) as QAResult;
    } catch (error) {
        console.error('QA service failed:', error);

        let errorMessage = "I'm currently unable to process your question due to service issues.";
        let errorCode = "SERVICE_UNAVAILABLE";

        if (error instanceof ServiceError) {
            errorMessage = error.message;
            errorCode = error.code || "SERVICE_ERROR";
        }

        return {
            answer: errorMessage + " Please try again later.",
            citations: [],
            success: false,
            error: errorCode
        };
    }
}
import {
    safeExecute,
    ServiceError,
    withRetry,
    withTimeout
} from "../lib/error-handling";

export type Citation = { path: string; chunkIndex: number; excerpt?: string };

export interface QAResult {
    answer: string;
    citations: Citation[];
    success: boolean;
    error?: string;
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
        return await withTimeout(async () => {
            return withRetry(async () => {
                try {
                    // Dynamic imports to avoid module loading issues
                    const { chatCompletion, embedTexts } = await import("./gemini");
                    const { queryVectors } = await import("./pinecone");

                    console.log(`Processing question for project ${projectId}: ${question.substring(0, 100)}...`);

                    // 1. RETRIEVAL STEP 1: Get the query vector (embedding for the question)
                    const qEmbedding = await safeExecute(
                        async () => {
                            const embeddings = await embedTexts([question.trim()]);
                            if (!embeddings || embeddings.length === 0) {
                                throw new Error("Failed to generate embedding for question");
                            }
                            return embeddings[0];
                        },
                        null,
                        'question embedding'
                    );

                    if (!qEmbedding) {
                        throw new ServiceError("Failed to generate embedding for question", "QA", "EMBEDDING_FAILED");
                    }

                    // 2. RETRIEVAL STEP 2: Perform similarity search to find top 10 relevant code chunks
                    const queryResp = await safeExecute(
                        async () => await queryVectors(qEmbedding, 10, projectId),
                        [],
                        'vector similarity search'
                    );

                    const matches = (Array.isArray(queryResp) ? queryResp : (queryResp as any).matches || [])
                        .filter((m: any) => m.score && m.score > 0.5) // Only include relevant matches with good similarity (threshold > 0.5)
                        .map((m: any) => ({ id: m.id, score: m.score, metadata: m.metadata }));

                    // 3. AUGMENTATION STEP: Construct structured context string from retrieved code chunks
                    let context = "";
                    const fileReferences: Citation[] = [];

                    if (matches.length > 0) {
                        for (const match of matches) {
                            const metadata = match.metadata;
                            if (metadata?.path && metadata?.text) {
                                // Add structured context for each relevant code chunk (similar to SQL RAG pattern)
                                context += `Source: ${metadata.path}\n`;
                                context += `Code Content: ${metadata.text}\n`;
                                context += `Summary of File: ${metadata.summary || metadata.text.slice(0, 200)}\n`;
                                context += `Relevance Score: ${(match.score * 100).toFixed(1)}%\n\n`;

                                // Track file references for citations
                                fileReferences.push({
                                    path: metadata.path,
                                    chunkIndex: metadata.chunkIndex || 0,
                                    excerpt: metadata.text
                                });
                            }
                        }
                    }

                    // 4. GENERATION STEP: Generate answer using augmented prompt with retrieved context
                    const prompt = matches.length === 0
                        ? `You are a helpful coding assistant. The user is asking about their project: "${question}". 

Since no specific code context was found, provide a detailed, comprehensive response about general software development practices related to their question. Include specific examples, best practices, and actionable steps. 

Suggest that they may need to ingest their project code first for more specific answers about their codebase.

Question: ${question}`
                        : `You are an AI code assistant with deep knowledge of software development. You have access to the user's repository code and should provide detailed, contextual answers.

Context from Repository:
${context}

User Question: ${question}

Instructions:
1. Analyze the provided code context carefully and base your answer on the actual codebase
2. Reference specific files, functions, and code patterns when relevant
3. Explain how the code works, its purpose, and any architectural patterns
4. If the user is asking about implementation, provide specific code examples from the context
5. Suggest improvements, best practices, or optimizations where appropriate
6. If the question involves debugging or troubleshooting, analyze the code for potential issues
7. Be thorough but concise, focusing on the most relevant aspects
8. Always cite the source files when referencing specific code

Provide a comprehensive answer:`;

                    const answerText = await safeExecute(
                        async () => await chatCompletion(prompt, 2000),
                        "I'm having trouble generating a response right now. Please try again in a moment.",
                        'answer generation'
                    );

                    const citations: Citation[] = fileReferences.slice(0, 5); // Limit to top 5 for UI

                    console.log(`Successfully answered question for project ${projectId}`);
                    return {
                        answer: answerText,
                        citations,
                        success: true
                    };
                } catch (error) {
                    console.error('QA operation failed:', error);

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
            }, {
                maxRetries: 2,
                retryCondition: (error) => {
                    // Don't retry on authentication or configuration errors
                    if (error instanceof ServiceError) {
                        return !error.code?.includes('UNAUTHORIZED') &&
                            !error.code?.includes('MISSING_API_KEY');
                    }
                    return true;
                }
            });
        }, 90000, 'QA operation timed out');
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

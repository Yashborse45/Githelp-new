export type Citation = { path: string; chunkIndex: number; excerpt?: string };

export async function answerQuestion(projectId: string, question: string) {
    // Early return if required environment variables are not set
    if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
        return {
            answer: "AI features are not configured. Please set PINECONE_API_KEY and GEMINI_API_KEY environment variables.",
            citations: [] as Citation[]
        };
    }

    try {
        // Dynamic imports to avoid module loading issues
        const { chatCompletion, embedTexts } = await import("./gemini");
        const { queryVectors } = await import("./pinecone");

        // Get question embedding
        const qEmbedding = (await embedTexts([question]))[0];

        if (!qEmbedding) {
            throw new Error("Failed to generate embedding for question");
        }

        // Query pinecone with project filter
        const queryResp: any = await queryVectors(qEmbedding, 5, projectId);
        const matches = (queryResp.matches || []).map((m: any) => ({ id: m.id, score: m.score, metadata: m.metadata }));

        // Provide a helpful response even if no context is found
        const context = matches.length > 0
            ? matches.map((m: any) => m.metadata?.text || '').filter(Boolean).join("\n---\n")
            : "No specific code context found for this project.";

        const prompt = context === "No specific code context found for this project."
            ? `You are a helpful coding assistant. The user is asking about their project: "${question}". Provide a detailed, comprehensive response about software development practices. Include specific examples, best practices, and actionable steps. If applicable, suggest they may need to ingest their project code first for more specific answers.`
            : `You are an expert code assistant helping a developer understand their codebase. 

**Context from Repository:**
${context}

**Question:** ${question}

**Instructions:**
1. Provide a detailed, comprehensive answer based on the code context above
2. Explain the code functionality, patterns, and architecture when relevant
3. Include specific file paths and code snippets in your explanation
4. Offer implementation suggestions, best practices, or improvements where appropriate
5. If the question asks about specific functionality, explain how it works step-by-step
6. Make your response thorough and educational

**Detailed Answer:**`;

        const answerText = await chatCompletion(prompt, 1500);

        const citations: Citation[] = matches
            .filter((m: any) => m.metadata?.path && m.metadata?.text)
            .map((m: any) => ({
                path: m.metadata.path,
                chunkIndex: m.metadata.chunkIndex || 0,
                excerpt: m.metadata.text
            }));

        return { answer: answerText, citations };
    } catch (error) {
        console.warn('QA failed:', error);

        // Provide a more helpful error message based on the error type
        let errorMessage = "Sorry, I encountered an error while trying to answer your question.";

        if (error instanceof Error) {
            if (error.message.includes("embed")) {
                errorMessage = "I'm having trouble processing your question. Please check that your Gemini API key is correctly configured.";
            } else if (error.message.includes("Pinecone")) {
                errorMessage = "I can't search through your project code right now. Please check your Pinecone configuration.";
            } else if (error.message.includes("chat")) {
                errorMessage = "I'm having trouble generating a response. Please try again in a moment.";
            }
        }

        return {
            answer: errorMessage + " If this problem persists, please check your AI service configurations.",
            citations: [] as Citation[]
        };
    }
}

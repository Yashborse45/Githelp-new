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

        // Query pinecone
        const queryResp: any = await queryVectors(qEmbedding, 5);
        const matches = (queryResp.matches || []).map((m: any) => ({ id: m.id, score: m.score, metadata: m.metadata }));

        const context = matches.map((m: any) => m.metadata.text).join("\n---\n");

        const prompt = `You are a helpful assistant. Use the following snippets from the repository to answer the question. Cite file paths when relevant.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

        const answerText = await chatCompletion(prompt, 800);

        const citations: Citation[] = matches.map((m: any) => ({ path: m.metadata.path, chunkIndex: m.metadata.chunkIndex, excerpt: m.metadata.text }));

        return { answer: answerText, citations };
    } catch (error) {
        console.warn('QA failed:', error);
        return { 
            answer: "Sorry, I encountered an error while trying to answer your question. Please check that your AI services are properly configured.", 
            citations: [] as Citation[] 
        };
    }
}

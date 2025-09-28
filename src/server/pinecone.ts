import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "githelp";

// Create pinecone instance only if API key is available
let pinecone: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
    if (!PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is required but not set in environment variables");
    }
    
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: PINECONE_API_KEY,
        });
    }
    
    return pinecone;
}

export async function upsertVectors(vectors: { id: string; values: number[]; metadata?: any }[]) {
    try {
        const pc = await getPineconeClient();
        const index = pc.index(PINECONE_INDEX);
        
        const batch = 100;
        for (let i = 0; i < vectors.length; i += batch) {
            const chunk = vectors.slice(i, i + batch);
            await index.upsert(chunk);
        }
    } catch (error) {
        console.warn('Pinecone upsert failed:', error);
        // Don't throw error to avoid breaking the main functionality
    }
}

export async function queryVectors(vector: number[], topK = 5) {
    try {
        const pc = await getPineconeClient();
        const index = pc.index(PINECONE_INDEX);
        const response = await index.query({
            vector,
            topK,
            includeMetadata: true,
        });
        return response;
    } catch (error) {
        console.warn('Pinecone query failed:', error);
        // Return empty response to avoid breaking the main functionality
        return { matches: [] };
    }
}

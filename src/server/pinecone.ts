import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "githelp";

let pinecone: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
    if (!PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY not set");
    }

    if (!pinecone) {
        pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    }

    return pinecone;
}

export async function upsertVectors(vectors: { id: string; values: number[]; metadata?: any }[]): Promise<void> {
    if (!vectors || vectors.length === 0) return;

    try {
        const pc = await getPineconeClient();
        const index = pc.index(PINECONE_INDEX);

        const batch = 100;
        for (let i = 0; i < vectors.length; i += batch) {
            const chunk = vectors.slice(i, i + batch);
            await index.upsert(chunk);
        }
        console.log(`Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
        console.error('Pinecone upsert failed:', error);
        throw error;
    }
}

export async function queryVectors(vector: number[], topK = 5, projectId?: string): Promise<any[]> {
    try {
        const pc = await getPineconeClient();
        const index = pc.index(PINECONE_INDEX);

        const queryOptions: any = {
            vector,
            topK,
            includeMetadata: true,
        };

        if (projectId) {
            queryOptions.filter = {
                projectId: { $eq: projectId }
            };
        }

        const result = await index.query(queryOptions);
        return result.matches || [];
    } catch (error) {
        console.warn('Pinecone query failed:', error);
        return [];
    }
}
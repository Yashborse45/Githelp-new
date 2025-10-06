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

    const pc = await getPineconeClient();
    const index = pc.index(PINECONE_INDEX);

    // Process in smaller batches
    const batchSize = 50;
    for (let i = 0; i < vectors.length; i += batchSize) {
        const chunk = vectors.slice(i, i + batchSize);
        await index.upsert(chunk);

        // Small delay between batches
        if (i + batchSize < vectors.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    console.log(`Upserted ${vectors.length} vectors to Pinecone`);
}

export async function queryVectors(vector: number[], topK = 5, projectId?: string): Promise<any[]> {
    const pc = await getPineconeClient();
    const index = pc.index(PINECONE_INDEX);

    const queryOptions: any = {
        vector,
        topK,
        includeMetadata: true,
    };

    if (projectId) {
        queryOptions.filter = { projectId };
    }

    const result = await index.query(queryOptions);
    return result.matches || [];
}
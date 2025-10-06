import crypto from "crypto";
import type { RepoFile } from "./github";

// Ignore patterns for repository file ingestion. Keep in sync with filtering in github.ts.
// Quick-win approach: simple substring / extension checks (not full globbing yet).
const IGNORE_SUBSTRINGS = [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    ".git/",
    ".next/",
];
const IGNORE_FILENAMES = [
    "yarn.lock",
    "package-lock.json",
];
const IGNORE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".exe",
    ".pdf",
];

export function shouldIgnore(filePath: string): boolean {
    const lower = filePath.toLowerCase();
    if (IGNORE_FILENAMES.some((f) => lower.endsWith("/" + f) || lower === f)) return true;
    if (IGNORE_SUBSTRINGS.some((s) => lower.includes(s))) return true;
    if (IGNORE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
    return false;
}

function hashText(text: string) {
    return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}

// Enhanced chunker with better overlap and context preservation
function chunkText(text: string, chunkSize = 1200, overlap = 300) {
    const chunks: string[] = [];

    // For small files, keep them as single chunks
    if (text.length <= chunkSize) {
        return [text];
    }

    for (let start = 0; start < text.length; start += chunkSize - overlap) {
        const end = Math.min(text.length, start + chunkSize);
        let chunk = text.slice(start, end);

        // Try to break at natural boundaries (newlines, function ends, etc.)
        if (end < text.length) {
            const lastNewline = chunk.lastIndexOf('\n');
            const lastBrace = chunk.lastIndexOf('}');
            const lastSemicolon = chunk.lastIndexOf(';');

            // Use the latest natural boundary if it's not too far back
            const naturalEnd = Math.max(lastNewline, lastBrace, lastSemicolon);
            if (naturalEnd > chunk.length * 0.8) {
                chunk = chunk.slice(0, naturalEnd + 1);
            }
        }

        chunks.push(chunk.trim());
    }
    return chunks.filter(chunk => chunk.length > 0);
}

export async function ingestFilesToPinecone(files: RepoFile[], projectId: string): Promise<{ processedFiles: number }> {
    // Check for required environment variables
    if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY is not configured. Please set it in your environment variables.');
    }
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
    }

    console.log(`Starting ingestion for project ${projectId}: ${files.length} files to process`);

    try {
        // Dynamic imports to avoid module loading issues
        const { embedTexts } = await import("./gemini");
        const { upsertVectors } = await import("./pinecone");

        const vectors: Array<any> = [];
        let processedFiles = 0;
        let skippedFiles = 0;

        for (const file of files) {
            if (shouldIgnore(file.path)) {
                skippedFiles++;
                continue;
            }
            // Skip empty / excessively large files
            if (!file.content || file.content.length > 200_000) {
                console.log(`Skipping ${file.path}: ${!file.content ? 'empty' : 'too large'}`);
                skippedFiles++;
                continue;
            }

            const chunks = chunkText(file.content, 1200, 300);
            if (!chunks.length) {
                skippedFiles++;
                continue;
            }

            console.log(`Processing file ${processedFiles + 1}/${files.length}: ${file.path} (${chunks.length} chunks)`);
            processedFiles += 1;

            const embeddings = await embedTexts(chunks);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (chunk == null || chunk.length < 50) continue; // Skip very small chunks
                const embedding = embeddings[i];
                if (!embedding) continue; // guard in case embedTexts returns shorter array
                const hash = hashText(chunk);

                const id = `${projectId}--${file.path}--${i}--${hash}`;
                const metadata = {
                    projectId,
                    path: file.path,
                    chunkIndex: i,
                    hash,
                    text: chunk, // Store full chunk for better context
                    summary: chunk.slice(0, 200) + (chunk.length > 200 ? '...' : ''), // Add summary for quick reference
                };

                vectors.push({ id, values: embedding, metadata });

                if (vectors.length >= 100) {
                    console.log(`Upserting batch of ${vectors.length} vectors to Pinecone...`);
                    await upsertVectors(vectors.splice(0, 100));
                }
            }
        }

        if (vectors.length > 0) {
            console.log(`Upserting final batch of ${vectors.length} vectors to Pinecone...`);
            await upsertVectors(vectors);
        }

        console.log(`Ingestion complete: ${processedFiles} files processed, ${skippedFiles} files skipped`);
        return { processedFiles };
    } catch (error) {
        console.error('Ingestion to Pinecone failed:', error);
        // Re-throw the error so the UI can show it
        if (error instanceof Error) {
            throw new Error(`Failed to process repository: ${error.message}`);
        }
        throw new Error('Failed to process repository: Unknown error occurred');
    }
}

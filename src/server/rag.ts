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
    // Early return if required environment variables are not set
    if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
        console.warn('Pinecone or Gemini API keys not configured. Skipping ingestion.');
        return { processedFiles: 0 };
    }

    try {
        // Dynamic imports to avoid module loading issues
        const { embedTexts } = await import("./gemini");
        const { upsertVectors } = await import("./pinecone");

        const vectors: Array<any> = [];
        let processedFiles = 0;

        for (const file of files) {
            if (shouldIgnore(file.path)) continue;
            // Skip empty / excessively large files
            if (!file.content || file.content.length > 200_000) continue;

            const chunks = chunkText(file.content, 1200, 300);
            if (!chunks.length) continue;
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
                    await upsertVectors(vectors.splice(0, 100));
                }
            }
        }

        if (vectors.length > 0) {
            await upsertVectors(vectors);
        }
        return { processedFiles };
    } catch (error) {
        console.warn('Ingestion to Pinecone failed:', error);
        return { processedFiles: 0 };
    }
}

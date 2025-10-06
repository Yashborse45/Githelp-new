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

// Sanitize text to remove problematic Unicode characters (emojis, surrogates, etc.)
function sanitizeText(text: string): string {
    // Remove unpaired surrogates and other problematic characters
    return text
        .replace(/[\ud800-\udfff]/g, '') // Remove surrogates
        .replace(/\uFFFD/g, '') // Remove replacement characters
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // Remove control characters
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
    if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY not configured');
    }
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    console.log(`Starting ingestion: ${files.length} files`);

    try {
        const { embedTexts } = await import("./gemini");
        const { upsertVectors } = await import("./pinecone");

        const vectors: Array<any> = [];
        let processedFiles = 0;

        for (const file of files) {
            if (shouldIgnore(file.path)) continue;
            if (!file.content || file.content.length > 200_000) continue;

            const chunks = chunkText(file.content, 1200, 300);
            if (!chunks.length) continue;

            processedFiles += 1;
            const embeddings = await embedTexts(chunks);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (chunk == null || chunk.length < 50) continue;
                const embedding = embeddings[i];
                if (!embedding) continue;
                const hash = hashText(chunk);

                // Sanitize text before storing in Pinecone to avoid Unicode errors
                const sanitizedChunk = sanitizeText(chunk);
                const sanitizedSummary = sanitizeText(chunk.slice(0, 200)) + (chunk.length > 200 ? '...' : '');

                const id = `${projectId}--${file.path}--${i}--${hash}`;
                const metadata = {
                    projectId,
                    path: file.path,
                    chunkIndex: i,
                    hash,
                    text: sanitizedChunk,
                    summary: sanitizedSummary,
                };

                vectors.push({ id, values: embedding, metadata });

                if (vectors.length >= 50) {
                    await upsertVectors(vectors.splice(0, 50));
                }
            }
        }

        if (vectors.length > 0) {
            await upsertVectors(vectors);
        }

        console.log(`Ingestion complete: ${processedFiles} files processed`);
        return { processedFiles };
    } catch (error) {
        console.error('Ingestion failed:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to process repository: ${error.message}`);
        }
        throw new Error('Failed to process repository');
    }
}

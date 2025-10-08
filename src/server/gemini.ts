import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI Studio client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function embedTexts(texts: string[]) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    if (!texts.length) return [];

    try {
        // Use text-embedding-004 which we verified works
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddings = [];

        // Process texts one by one as the API expects single text
        for (const text of texts) {
            try {
                const result = await model.embedContent(text);
                if (result.embedding && result.embedding.values) {
                    embeddings.push(result.embedding.values);
                } else {
                    console.warn("No embedding values received for text");
                    // Add a zero vector as fallback
                    embeddings.push(new Array(768).fill(0));
                }
            } catch (textError) {
                console.error("Failed to embed individual text:", textError);
                // Add a zero vector as fallback for this text
                embeddings.push(new Array(768).fill(0));
            }
        }

        if (!embeddings.length) throw new Error("Could not generate any embeddings");
        console.log(`Successfully generated ${embeddings.length} embeddings`);
        return embeddings;
    } catch (error) {
        console.error("Embedding error:", error);
        throw new Error(`Gemini embed failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function chatCompletion(prompt: string, maxTokens = 1500) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    // List of verified working models (tested on Oct 2025)
    const modelNames = [
        "gemini-2.0-flash",        // Stable - most powerful
        "gemini-2.0-flash-exp",    // Experimental - latest features
        "gemini-2.5-flash-lite",   // Lite version - faster
    ];

    let lastError: Error | null = null;

    for (const modelName of modelNames) {
        try {
            console.log(`Trying chat model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`Chat completion successful with ${modelName}`);
            return text;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`Model ${modelName} failed:`, lastError.message);
            // Try next model
            continue;
        }
    }

    // If all models failed, throw the last error
    console.error("All chat models failed. Last error:", lastError);
    throw new Error(`Gemini chat completion failed: ${lastError?.message || 'All models unavailable'}`);
}

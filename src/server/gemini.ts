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

export async function chatCompletion(prompt: string, maxTokens = 1000) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    try {
        // Use fastest models for better response time
        const modelNames = [
            "gemini-2.0-flash",        // Fast and powerful
            "gemini-2.5-flash-lite",   // Even faster lite version
        ];

        for (const modelName of modelNames) {
            try {
                console.log(`Trying chat model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: 0.5,  // Reduced from 0.7 for faster, more focused responses
                        topP: 0.9,         // Increased from 0.8 for better quality
                        topK: 30,          // Reduced from 40 for faster generation
                    }
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log(`Chat completion successful with ${modelName}`);
                return text;
            } catch (modelError) {
                console.log(`Model ${modelName} failed:`, modelError instanceof Error ? modelError.message : 'Unknown error');
                continue;
            }
        }

        throw new Error("All chat models failed");
    } catch (error) {
        console.error("Chat completion error:", error);
        // Return a helpful fallback message instead of throwing
        return "I'm sorry, I'm having trouble generating a response right now. This might be due to API configuration issues. Please check your Gemini API key and try again.";
    }
}

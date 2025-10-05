import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const run = async () => {
    console.log("🔍 Verifying Gemini key...");
    if (!process.env.GEMINI_API_KEY) return console.error("❌ No GEMINI_API_KEY found");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Reply with: Gemini connection successful!");
        console.log("✅ Gemini replied:", result.response.text());
    } catch (error) {
        console.error("❌ Gemini test failed:", error);
    }
};

run();

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    try {
        console.log(`\n🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.7,
            }
        });

        const prompt = "Say 'Hello! I am working correctly.' in one sentence.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`✅ SUCCESS - ${modelName}`);
        console.log(`Response: ${text}`);
        return { modelName, success: true, response: text };
    } catch (error) {
        console.log(`❌ FAILED - ${modelName}`);
        console.log(`Error: ${error.message}`);
        return { modelName, success: false, error: error.message };
    }
}

async function runTests() {
    console.log("=".repeat(60));
    console.log("GEMINI MODEL AVAILABILITY TEST");
    console.log("=".repeat(60));

    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY not found in environment variables");
        process.exit(1);
    }

    console.log("✓ API Key found:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

    const modelsToTest = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
    ];

    console.log("Testing Gemini models...\n"); const results = [];
    for (const modelName of modelsToTest) {
        const result = await testModel(modelName);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));

    const successfulModels = results.filter(r => r.success);
    const failedModels = results.filter(r => !r.success);

    console.log(`\n✅ Working models (${successfulModels.length}):`);
    successfulModels.forEach(m => console.log(`   - ${m.modelName}`));

    console.log(`\n❌ Failed models (${failedModels.length}):`);
    failedModels.forEach(m => console.log(`   - ${m.modelName}: ${m.error}`));

    if (successfulModels.length > 0) {
        console.log(`\n🎯 Recommended model to use: ${successfulModels[0].modelName}`);
    } else {
        console.log("\n⚠️  No models are working! Please check your API key.");
    }
}

runTests().catch(console.error);

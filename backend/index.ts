import "dotenv/config"
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: "say hi 5 times.",
    });
    console.log(response.text);
    console.log("Usage:", response.usageMetadata);
}

main();
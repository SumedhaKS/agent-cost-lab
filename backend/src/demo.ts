import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt, POLICY_TEXT, buildFakeHistory } from "./resources";
import { localTools } from "./tools";
import { searchPolicyKB } from "./search";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function countTokens(contents: string): Promise<number> {
    const result = await ai.models.countTokens({
        model: "gemini-3.5-flash-lite",
        contents
    });
    return result.totalTokens ?? 0;
}

async function measureStage(label: string, includeStandalonePolicy: boolean, historyPolicyContent: string) {
    const parts = [
        systemPrompt,
        includeStandalonePolicy ? POLICY_TEXT : "",
        JSON.stringify(buildFakeHistory(historyPolicyContent)),
        JSON.stringify(localTools),
    ].join("\n");

    const total = await countTokens(parts);
    console.log(`${label}: ${total} tokens`);
    return total;
}

async function main() {
    console.log("Token cost comparison — bloated vs optimized agent step\n");
    await measureStage("1. Original (duplicate policy block + full doc in history)", true, POLICY_TEXT);
    await measureStage("2. After Opt 1 — remove duplicate block", false, POLICY_TEXT);
    
    const retrieved = await searchPolicyKB("late delivery refund eligibility");
    await measureStage("3. After Opt 2 — dynamic retrieval instead of full doc", false, retrieved);
}

main();
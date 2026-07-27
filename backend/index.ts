import "dotenv/config"
import { GoogleGenAI } from "@google/genai";
import { cosineSimilarity, fakeHistory, POLICY_TEXT, policySections, systemPrompt } from "./resources";
import { localTools } from "./tools"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function tokensCalculator(contents: string): Promise<number | undefined> {
    const count = await ai.models.countTokens({
        model: "gemini-3.5-flash-lite",
        contents,
    })
    return count.totalTokens
}

async function main() {
    console.log("A bloated agent-->");
    // const promptContent = `System Prompt: ${systemPrompt}, Policy: ${POLICY_TEXT}, History: ${JSON.stringify(fakeHistory)}, Available tools: ${JSON.stringify(localTools)}`
    // console.log("\n Count: ", await tokensCalculator(promptContent))
    // policyTokens
    const [sysTokens, historyTokens, toolsTokens] = await Promise.all([
        tokensCalculator(systemPrompt),
        // tokensCalculator(POLICY_TEXT),
        tokensCalculator(JSON.stringify(fakeHistory)),
        tokensCalculator(JSON.stringify(localTools)),
    ])
    console.log({ sysTokens, historyTokens, toolsTokens })
}

main();

async function optimizedFlow() {
    // 1) embed the policy.  2) embed the query. 3) Run similarity check. 4) return best match.

    const policyEmbedding = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: [POLICY_TEXT],
    });

    const queryEmbedding = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: ["late delivery refund eligibility"],
    });

    const policyVec = policyEmbedding.embeddings?.[0]?.values;
    const queryVec = queryEmbedding.embeddings?.[0]?.values;

    if (!policyVec || !queryVec) {
        throw new Error("Failed to get embeddings");
    }

    const similarity = cosineSimilarity(policyVec, queryVec);
    console.log(similarity);

}

// optimizedFlow()

export async function searchPolicyKB(query: string): Promise<string> {
    // console.log(policySections.length, '\n');

    const sectionEmbeddings = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: policySections,
        config: { taskType: "RETRIEVAL_DOCUMENT" }
    })

    // console.log(sectionEmbeddings.embeddings?.length, '\n');

    const queryEmbeddings = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: [query],
        config: { taskType: "RETRIEVAL_QUERY" }
    })

    const queryVec = queryEmbeddings.embeddings?.[0]?.values;
    if (!queryVec) throw new Error("Failed to embed query");

    let highest = 0.00;
    let highestIndex = 0;

    sectionEmbeddings.embeddings?.forEach((section, i) => {
        let x = cosineSimilarity(queryVec, (section.values ?? []))
        // console.log(`Section ${i}: score = ${x}`)
        if (x > highest) {
            highest = x;
            highestIndex = i;
        }
    })

    return policySections[highestIndex]!;
}

// console.log(await searchPolicyKB("can I return a gift card"))
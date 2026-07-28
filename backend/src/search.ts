// src/search.ts
import { GoogleGenAI } from "@google/genai";
import { cosineSimilarity, policySections } from "./resources";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function searchPolicyKB(query: string): Promise<string> {
  const sectionEmbeddings = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: policySections,
    config: { taskType: "RETRIEVAL_DOCUMENT" },
  });
  const queryEmbeddings = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [query],
    config: { taskType: "RETRIEVAL_QUERY" },
  });

  const queryVec = queryEmbeddings.embeddings?.[0]?.values;
  if (!queryVec) throw new Error("Failed to embed query");

  let highest = 0.0;
  let highestIndex = 0;
  sectionEmbeddings.embeddings?.forEach((section, i) => {
    const score = cosineSimilarity(queryVec, section.values ?? []);
    if (score > highest) { highest = score; highestIndex = i; }
  });

  return policySections[highestIndex]!;
}
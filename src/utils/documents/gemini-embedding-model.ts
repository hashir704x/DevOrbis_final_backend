import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  outputDimensionality: 1536,
});

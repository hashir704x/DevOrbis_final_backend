import { Document } from "@langchain/core/documents";
import { geminiEmbeddings } from "./gemini-embedding-model.js";

const BATCH_SIZE = 200;

export async function generateEmbeddings(chunks: Document[]) {
  const batches: Document[][] = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }
  const results: {
    chunk: Document;
    embedding: number[];
  }[] = [];
  for (const batch of batches) {
    const texts = batch.map((chunk) => chunk.pageContent);
    console.log("Calling embedding model");
    const embeddings = await geminiEmbeddings.embedDocuments(texts);
    for (let i = 0; i < batch.length; i++) {
      const chunk = batch[i];
      const embedding = embeddings[i];
      if (!chunk || !embedding) {
        throw new Error("Chunk and embedding count mismatch");
      }
      results.push({
        chunk,
        embedding,
      });
    }
  }
  return results;
}

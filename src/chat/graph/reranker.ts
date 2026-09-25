import type { RawRetrievedChunk } from "../../types/types.js";
import { LLM } from "../../utils/gemini-llm-model.js";
import { saveAiUsage } from "../../utils/saveAiUsage.js";
import { rerankChunksSchema } from "../../zod-schemas/reranker.schema.js";

export const rerankerLLM = LLM.withStructuredOutput(rerankChunksSchema, {
  includeRaw: true,
});

export async function rerankChunks(
  query: string,
  chunks: RawRetrievedChunk[],
): Promise<RawRetrievedChunk[]> {
  console.log("reranker called");
  if (chunks.length === 0) {
    return [];
  }

  const candidates = chunks.map((chunk) => ({
    id: chunk.id,
    content: chunk.chunk_text,
  }));
  console.log("Called reranker");
  const result = await rerankerLLM.invoke([
    {
      role: "system",
      content: `
        You are a document reranking assistant.

        Your task is to identify the 3 most relevant document chunks for answering the user's query.

        Evaluate each candidate chunk based on how directly and accurately it can help answer the query.

        Return the IDs of the 3 most relevant chunks in descending order of relevance.

        Do not modify the IDs.
        Do not return document content.
        Only return the ranked chunk IDs.
      `,
    },
    {
      role: "user",
      content: `
      User query:
      ${query}

      Candidate chunks:
      ${JSON.stringify(candidates)}
      `,
    },
  ]);

  const usage = result.raw.response_metadata.tokenUsage as {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  await saveAiUsage({
    type: "llm",
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  });

  const rankedIds = result.parsed.rankedChunkIds;
  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const rankedChunks = rankedIds.map((id) => {
    const chunk = chunksById.get(id);
    if (!chunk) {
      throw new Error(`Reranker returned an invalid chunk ID: ${id}`);
    }
    return chunk;
  });
  return rankedChunks;
}

import { sql } from "drizzle-orm";
import { geminiEmbeddings } from "./gemini-embedding-model.js";
import { db } from "../../drizzle/database-client.js";
import type { RawRetrievedChunk } from "../../types/types.js";

export async function retrieveChunks(
  query: string,
  matchCount: number = 5,
): Promise<RawRetrievedChunk[]> {
  const queryEmbedding = await geminiEmbeddings.embedQuery(query);
  const vector = `[${queryEmbedding.join(",")}]`;
  const result = await db.execute(
    sql`
        SELECT *
        FROM match_document_chunks(
            ${vector}::vector,
            ${matchCount}
        )
    `,
  );
  return result.rows as RawRetrievedChunk[];
}

import { Document } from "@langchain/core/documents";
import { db } from "../../drizzle/database-client.js";
import { documentChunks } from "../../drizzle/schema.js";

export async function storeChunks(
    documentId: string,
    results: {
        chunk: Document;
        embedding: number[];
    }[],
) {
    const values = results.map(({ chunk, embedding }) => ({
        documentId,
        chunkText: chunk.pageContent,
        metadata: chunk.metadata,
        embedding,
    }));
    await db.insert(documentChunks).values(values);
}

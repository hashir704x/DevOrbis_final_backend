import { extractText } from "./extract-text.js";
import { splitDocuments } from "./split-documents.js";
import { generateEmbeddings } from "./embeddings.js";
import { storeChunks } from "./store-chunks.js";

export async function processDocument({
  buffer,
  documentId,
  mimeType,
}: {
  documentId: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const documents = await extractText({ buffer, mimeType });
  const chunks = await splitDocuments(documents);
  const embeddings = await generateEmbeddings(chunks);
  await storeChunks(documentId, embeddings);
}

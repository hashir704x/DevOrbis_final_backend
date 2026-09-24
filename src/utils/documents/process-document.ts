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
    console.log("1");
    const documents = await extractText({ buffer, mimeType });
    console.log("2");
    const chunks = await splitDocuments(documents);
    console.log("3");
    const embeddings = await generateEmbeddings(chunks);
    console.log("4");
    await storeChunks(documentId, embeddings);
    console.log("5");
}

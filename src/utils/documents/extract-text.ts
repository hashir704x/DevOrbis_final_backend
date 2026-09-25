import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

export async function extractText({
  buffer,
  mimeType,
}: {
  buffer: Buffer;
  mimeType: string;
}) {
  const blob = new Blob([new Uint8Array(buffer)], {
    type: mimeType,
  });
  let loader: PDFLoader | DocxLoader;
  if (mimeType === "application/pdf") {
    loader = new PDFLoader(blob);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    loader = new DocxLoader(blob);
  } else {
    throw new Error(`Unsupported document type: ${mimeType}`);
  }
  return await loader.load();
}

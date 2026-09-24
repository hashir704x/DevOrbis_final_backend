import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { RawRetrievedChunk, RetrievedChunk } from "../../../types/types.js";
import type { GraphState } from "../graph.js";
import { retrieveChunks } from "../../../utils/documents/retrieve-chunks.js";
import { ragPrompt } from "../prompts.js";
import { LLM } from "../../../utils/gemini-llm-model.js";
import { saveAiUsage } from "../../../utils/saveAiUsage.js";

function buildKnowledgeBaseContext(chunks: RawRetrievedChunk[]) {
  return chunks
    .map(
      (chunk, index) => `
            --- Source ${index + 1} ---
            Document ID: ${chunk.document_id}
            Page: ${chunk.metadata?.loc?.pageNumber ?? "Unknown"}
            Lines: ${
              chunk.metadata?.loc?.lines?.from != null &&
              chunk.metadata?.loc?.lines?.to != null
                ? `${chunk.metadata.loc.lines.from}-${chunk.metadata.loc.lines.to}`
                : "Unknown"
            }
            Content:
            ${chunk.chunk_text}
            `,
    )
    .join("\n");
}

export async function ragNode(
  state: typeof GraphState.State,
  config: { writer: (data: unknown) => void },
) {
  console.log("RAG NODE REACHED");
  const lastMessage = state.messages[state.messages.length - 1];
  if (!lastMessage) {
    throw new Error("No message found for RAG retrieval.");
  }
  if (!(lastMessage instanceof HumanMessage)) {
    throw new Error("RAG node expected the latest message to be from the user.");
  }
  if (typeof lastMessage.content !== "string") {
    throw new Error("User message content must be a string.");
  }
  const query = lastMessage.content;
  const rawChunks = await retrieveChunks(query, 5);
  const knowledgeBaseContext = buildKnowledgeBaseContext(rawChunks);
  const messages = [
    {
      role: "system",
      content: `${ragPrompt}
        ## Retrieved Knowledge Base Context
        ${knowledgeBaseContext}`,
    },
    ...state.messages,
  ];
  const stream = await LLM.stream(messages);
  let fullResponse = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;

  for await (const chunk of stream) {
    const usage = chunk.usage_metadata as unknown as {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
    inputTokens += usage?.input_tokens ?? 0;
    outputTokens += usage?.output_tokens ?? 0;
    totalTokens += usage?.total_tokens ?? 0;
    const content = chunk.content;
    if (typeof content === "string") {
      fullResponse += content;
      config.writer(content);
    }
  }
  await saveAiUsage({
    type: "llm",
    inputTokens,
    outputTokens,
    totalTokens,
  });
  return {
    messages: [new AIMessage(fullResponse)],
  };
}

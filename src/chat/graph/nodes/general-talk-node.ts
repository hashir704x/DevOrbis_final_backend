import { AIMessage } from "@langchain/core/messages";
import { LLM } from "../../../utils/gemini-llm-model.js";
import type { GraphState } from "../graph.js";
import { generalTalkPrompt } from "../prompts.js";
import { saveAiUsage } from "../../../utils/saveAiUsage.js";

export async function generalTalkNode(
  state: typeof GraphState.State,
  config: { writer: (data: unknown) => void },
) {
  console.log("GENERAL TALK NODE REACHED");
  const messages = [
    {
      role: "system",
      content: generalTalkPrompt,
    },
    ...state.messages,
  ];
  let fullResponse = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  const stream = await LLM.stream(messages);

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

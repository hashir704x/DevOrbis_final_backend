import { LLM } from "../../../utils/gemini-llm-model.js";
import { orchestratorOutputSchema } from "../../../zod-schemas/agents.schemas.js";
import type { GraphState } from "../graph.js";
import { orchestratorPrompt } from "../prompts.js";
import { saveAiUsage } from "../../../utils/saveAiUsage.js";

const orchestratorLLM = LLM.withStructuredOutput(orchestratorOutputSchema, {
  includeRaw: true,
});

export async function orchestratorNode(state: typeof GraphState.State) {
  console.log("ORCHESTRATOR NODE REACHED");
  const response = await orchestratorLLM.invoke([
    {
      role: "system",
      content: orchestratorPrompt,
    },
    ...state.messages,
  ]);
  const usage = response.raw.response_metadata.tokenUsage as {
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

  return {
    route: response.parsed.route,
  };
}

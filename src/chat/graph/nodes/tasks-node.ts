import { eq } from "drizzle-orm";
import { db } from "../../../drizzle/database-client.js";
import { leads } from "../../../drizzle/schema.js";
import type { GraphState } from "../graph.js";
import { taskPrompt } from "../prompts.js";
import { AIMessage } from "@langchain/core/messages";
import { createTasksTools } from "../tools.js";
import { LLM } from "../../../utils/gemini-llm-model.js";
import { saveAiUsage } from "../../../utils/saveAiUsage.js";

export async function tasksNode(
  state: typeof GraphState.State,
  config: { writer: (data: unknown) => void },
) {
  console.log("TASKS NODE REACHED");
  const [userLead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.userId, state.userId))
    .limit(1);
  if (!userLead) {
    const response = "You need to be a CodeNest lead to access task information.";
    config.writer(response);
    return {
      messages: [new AIMessage(response)],
    };
  }
  const { getTasks } = createTasksTools(state.userId);
  const tasksLLM = LLM.bindTools([getTasks]);
  const messages = [
    {
      role: "system",
      content: taskPrompt,
    },
    ...state.messages,
  ];
  const response = await tasksLLM.invoke(messages);
  const usage = response.response_metadata.tokenUsage as {
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
  if (response.tool_calls?.length) {
    if (response.tool_calls.length > 1) {
      throw new Error("Tasks agent requested multiple tool calls.");
    }
    const toolCall = response.tool_calls[0];
    if (!toolCall) {
      throw new Error("Tool call not found.");
    }
    if (toolCall.name !== "getTasks") {
      throw new Error(`Unexpected tool call: ${toolCall.name}`);
    }
    const toolResult = await getTasks.invoke(toolCall);
    const finalStream = await LLM.stream([
      ...messages,
      response,
      {
        role: "tool",
        content: JSON.stringify(toolResult),
        tool_call_id: toolCall.id,
      },
    ]);
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let fullResponse = "";
    for await (const chunk of finalStream) {
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
  const content = response.content;
  if (typeof content !== "string") {
    throw new Error("Tasks agent returned an unsupported response format.");
  }
  config.writer(content);
  return {
    messages: [new AIMessage(content)],
  };
}

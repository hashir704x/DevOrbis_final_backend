import { AIMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import { db } from "../../../drizzle/database-client.js";
import { leads } from "../../../drizzle/schema.js";
import { LLM } from "../../../utils/gemini-llm-model.js";
import type { GraphState } from "../graph.js";
import { leadPrompt } from "../prompts.js";
import { createLeadTools } from "../tools.js";
import { saveAiUsage } from "../../../utils/saveAiUsage.js";

export async function leadNode(
  state: typeof GraphState.State,
  config: { writer: (data: unknown) => void },
) {
  console.log("LEAD NODE REACHED");
  const existingLead = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.userId, state.userId))
    .limit(1);

  const isLead = existingLead.length > 0;
  if (isLead) {
    const leadMessages = [
      {
        role: "system",
        content: `
                    The user is already an active CodeNest lead.

                    Your only task is to inform the user that they are already an active lead in our system.
                    Do not ask for any lead information.
                    Do not call any tools.
                    Do not try to create another lead.
                    Keep the response concise and natural.
                 `,
      },
      ...state.messages,
    ];

    const stream = await LLM.stream(leadMessages);
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    let fullResponse = "";
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
  const { createLead } = createLeadTools(state.userId);
  const leadLLM = LLM.bindTools([createLead]);
  const messages = [
    {
      role: "system",
      content: leadPrompt,
    },
    ...state.messages,
  ];
  const response = await leadLLM.invoke(messages);
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
    console.log("Calling tools", response.tool_calls);
    if (response.tool_calls.length > 1) {
      throw new Error("Lead agent requested multiple tool calls.");
    }
    const toolCall = response.tool_calls[0];
    if (!toolCall) {
      throw new Error("Tool call not found");
    }
    if (toolCall.name !== "createLead") {
      throw new Error(`Unexpected tool call: ${toolCall.name}`);
    }
    const toolResult = await createLead.invoke(toolCall);
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
    throw new Error("Lead agent returned an unsupported response format.");
  }
  config.writer(content);
  return {
    messages: [new AIMessage(content)],
  };
}

import { db } from "../drizzle/database-client.js";
import { aiUsage } from "../drizzle/schema.js";

export async function saveAiUsage({
  type,
  inputTokens,
  outputTokens,
  totalTokens,
}: {
  type: "llm" | "embedding";
  inputTokens: number;
  outputTokens?: number;
  totalTokens: number;
}) {
  const inputPricePerToken = 0.25 / 1_000_000;
  const outputPricePerToken = 1.5 / 1_000_000;
  const inputCost = inputTokens * inputPricePerToken;
  const outputCost = (outputTokens ?? 0) * outputPricePerToken;
  const cost = inputCost + outputCost;
  const [usage] = await db
    .insert(aiUsage)
    .values({
      type,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: cost.toString(),
    })
    .returning();
  return usage;
}

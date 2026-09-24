import { sql } from "drizzle-orm";
import { db } from "../drizzle/database-client.js";
import { aiUsage } from "../drizzle/schema.js";
import type { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse.js";

export async function getAiUsageStats(req: Request, res: Response) {
  const [stats] = await db
    .select({
      totalInputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`,
      totalOutputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`,
      totalTokens: sql<number>`coalesce(sum(${aiUsage.totalTokens}), 0)`,
      totalCost: sql<string>`coalesce(sum(${aiUsage.cost}), 0)`,
    })
    .from(aiUsage);
  return res
    .status(200)
    .json(new ApiResponse(true, "AI usage statistics fetched successfully", stats));
}

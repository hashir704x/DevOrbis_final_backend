import { z } from "zod";

export const rerankChunksSchema = z.object({
  rankedChunkIds: z.array(z.number()).min(1).max(3),
});

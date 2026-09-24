import { z } from "zod";

export const orchestratorOutputSchema = z.object({
    route: z.enum(["rag", "tasks", "lead", "general_talk"]),
});

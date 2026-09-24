import { z } from "zod";

export const chatMessageSchema = z.object({
    message: z.string().nonempty(),
});

export const chatIdParamsSchema = z.object({
    chatId: z.uuid(),
});

export const createChatSchema = z.object({
    title: z.string().nonempty(),
});

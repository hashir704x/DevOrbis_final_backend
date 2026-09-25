import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().nonempty("Chat message cannot be empty"),
});

export const chatIdParamsSchema = z.object({
  chatId: z.uuid("Invalid UUID"),
});

export const createChatSchema = z.object({
  title: z.string().nonempty("Title is required"),
});

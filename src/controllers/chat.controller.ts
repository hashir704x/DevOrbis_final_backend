import type { Request, Response } from "express";
import { db } from "../drizzle/database-client.js";
import { chats, messages, users } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";
import type { JwtPayload } from "../types/types.js";
import { eq, desc, and, asc } from "drizzle-orm";
import {
    chatIdParamsSchema,
    createChatSchema,
} from "../zod-schemas/chat.schemas.js";

export async function createChat(req: Request, res: Response) {
    const { title } = createChatSchema.parse(req.body);
    const userData = req.userData as JwtPayload;
    const userId = userData.userId;
    const [chat] = await db
        .insert(chats)
        .values({
            userId,
            title,
        })
        .returning();
    return res
        .status(201)
        .json(new ApiResponse(true, "Chat created successfully", chat));
}

export async function getChats(req: Request, res: Response) {
    const userData = req.userData as JwtPayload;
    const userId = userData.userId;
    const userChats = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.updatedAt));
    return res
        .status(200)
        .json(new ApiResponse(true, "Chats fetched successfully", userChats));
}

export async function getChatMessages(req: Request, res: Response) {
    const result = chatIdParamsSchema.parse(req.params);
    const chatId = result.chatId;
    const userData = req.userData as JwtPayload;
    const userId = userData.userId;
    const [chat] = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
        .limit(1);
    if (!chat) {
        return res.status(404).json(new ApiResponse(false, "Chat not found", null));
    }
    const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.createdAt));
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Chat messages fetched successfully",
                chatMessages,
            ),
        );
}

export async function getAllChatsForAdmin(req: Request, res: Response) {
    const allChats = await db
        .select({
            id: chats.id,
            title: chats.title,
            userId: chats.userId,
            userName: users.username,
            userEmail: users.email,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
        })
        .from(chats)
        .leftJoin(users, eq(chats.userId, users.id))
        .orderBy(desc(chats.updatedAt));
    return res
        .status(200)
        .json(new ApiResponse(true, "Chats fetched successfully", allChats));
}

export async function getChatMessagesForAdmin(req: Request, res: Response) {
    const result = chatIdParamsSchema.parse(req.params);
    const chatMessages = await db
        .select({
            id: messages.id,
            chatId: messages.chatId,
            userId: messages.userId,
            from: messages.from,
            content: messages.content,
            createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.chatId, result.chatId))
        .orderBy(asc(messages.createdAt));
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Chat messages fetched successfully",
                chatMessages,
            ),
        );
}

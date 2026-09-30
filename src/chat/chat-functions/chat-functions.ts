import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { graph } from "../graph/graph.js";
import { db } from "../../drizzle/database-client.js";
import { chats, messages } from "../../drizzle/schema.js";
import { eq, asc, and } from "drizzle-orm";

export async function processChatMessage(
    message: string,
    userId: string,
    chatId: string,
    onChunk: (chunk: string) => void,
) {
    const ownsChat = await verifyChatOwnership(chatId, userId);
    if (!ownsChat) {
        throw new Error("You are not allowed to send message in this chat");
    }
    await saveChatMessage(chatId, userId, "Human", message);
    const chatMessages = await getChatMessages(chatId);
    const langchainMessages = chatMessages.map((message) => {
        if (message.from === "Human") {
            return new HumanMessage(message.content);
        }
        return new AIMessage(message.content);
    });
    const stream = await graph.stream(
        {
            messages: langchainMessages,
            userId: userId,
        },
        { streamMode: "custom" },
    );
    let aiContent = "";
    for await (const chunk of stream) {
        aiContent += chunk;
        onChunk(chunk);
    }
    await saveChatMessage(chatId, userId, "Ai", aiContent);
}

export async function saveChatMessage(
    chatId: string,
    userId: string,
    from: "Human" | "Ai",
    content: string,
) {
    const [message] = await db
        .insert(messages)
        .values({
            chatId,
            userId,
            from,
            content,
        })
        .returning();
    return message;
}

export async function getChatMessages(chatId: string) {
    return await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.createdAt));
}

export async function verifyChatOwnership(chatId: string, userId: string) {
    const [chat] = await db
        .select({ id: chats.id })
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
        .limit(1);
    return !!chat;
}

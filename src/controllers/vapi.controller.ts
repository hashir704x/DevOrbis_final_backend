import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { graph } from "../chat/graph/graph.js";
import type { Request, Response } from "express";

export async function handleVoiceChat(req: Request, res: Response) {
    console.log("Voice call came");
    try {
        const userId = req.body.assistant.variableValues.user_id;
        const vapiMessages = req.body.messages;
        const langchainMessages = vapiMessages
            .filter(
                (message: any) =>
                    message.role === "user" || message.role === "assistant",
            )
            .map((message: any) => {
                if (message.role === "user") {
                    return new HumanMessage(message.content);
                }
                return new AIMessage(message.content);
            });
        console.log("Messages", langchainMessages);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const stream = await graph.stream(
            {
                messages: langchainMessages,
                userId: userId,
            },
            { streamMode: "custom" },
        );
        for await (const chunk of stream) {
            const data = {
                id: "vapi-response",
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: "custom-llm",
                choices: [
                    {
                        index: 0,
                        delta: {
                            content: chunk,
                        },
                        finish_reason: null,
                    },
                ],
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        console.error("Vapi LLM error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Failed to process voice request",
            });
        } else {
            res.end();
        }
    }
}

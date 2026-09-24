import { Server } from "socket.io";
import { processChatMessage } from "../chat-functions/chat-functions.js";
import { socketErrorHandler } from "./socket-error-handler.js";
import { socketAuthMiddleware } from "./socket-auth-middleware.js";

export function initializeSocket(io: Server) {
    io.use(socketAuthMiddleware);
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
        socket.on("chat:message", async (payload) => {
            try {
                const userData = socket.data.userData;
                const { chatId, message } = payload;
                await processChatMessage(
                    message,
                    userData.userId,
                    chatId,
                    (chunk) => {
                        // console.log("emitting chunk", chunk)
                        socket.emit("chat:chunk", chunk);
                    },
                );
                socket.emit("chat:complete");
            } catch (error) {
                socketErrorHandler(socket, error);
            }
        });
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
}

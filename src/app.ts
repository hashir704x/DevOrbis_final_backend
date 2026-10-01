import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import testRoutes from "./routes/test.route.js";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import documentRoutes from "./routes/document.route.js";
import tasksRoutes from "./routes/task.route.js";
import staffRoutes from "./routes/staff.route.js";
import leadRoutes from "./routes/lead.route.js";
import aiUsageRoutes from "./routes/ai-usage.route.js";
import vapiRoutes from "./routes/vapi.route.js";
import adminRoutes from "./routes/admin.route.js";
import redisRoutes from "./routes/redis-test.route.js";

import { errorMiddleware } from "./middleware/error.middleware.js";
import { initializeSocket } from "./chat/socket/socket.js";

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!PORT) {
    throw new Error("PORT is not set in the .env file ");
}

if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in the .env file ");
}

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        credentials: true,
    },
});
initializeSocket(io);

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/lead", leadRoutes);
app.use("/api/ai-usage", aiUsageRoutes);
app.use("/api/vapi", vapiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

app.use("/redis", redisRoutes);



app.use(errorMiddleware);

server.listen(PORT, function () {
    console.log("Server is running on port:", PORT);
});

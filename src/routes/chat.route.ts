import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createChat,
    getChats,
    getChatMessages,
    getAllChatsForAdmin,
    getChatMessagesForAdmin
} from "../controllers/chat.controller.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/create-chat",
    authMiddleware,
    authorizeRole("user"),
    asyncHandler(createChat),
);

router.get("/", authMiddleware, authorizeRole("user"), asyncHandler(getChats));

router.get(
    "/get-chats-for-admin",
    authMiddleware,
    authorizeRole("admin"),
    asyncHandler(getAllChatsForAdmin),
);


router.get(
    "/get-chat-messages-for-admin/:chatId",
    authMiddleware,
    authorizeRole("admin"),
    asyncHandler(getChatMessagesForAdmin),
);

router.get(
    "/:chatId",
    authMiddleware,
    authorizeRole("user"),
    asyncHandler(getChatMessages),
);



export default router;

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createChat,
  getChats,
  getChatMessages,
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
  "/:chatId",
  authMiddleware,
  authorizeRole("user"),
  asyncHandler(getChatMessages),
);
export default router;

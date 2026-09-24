import { getAiUsageStats } from "../controllers/ai-usage.controller.js";
import { Router } from "express";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/get-ai-usage",
  authMiddleware,
  authorizeRole("admin"),
  asyncHandler(getAiUsageStats),
);

export default router;

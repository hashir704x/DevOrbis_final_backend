import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllLeads } from "../controllers/lead.controller.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/get-all-leads",
  authMiddleware,
  authorizeRole("admin", "staff"),
  asyncHandler(getAllLeads),
);

export default router;

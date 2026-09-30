import { Router } from "express";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAdminDashboardStats } from "../controllers/admin.controller.js";

const router = Router();

router.get(
    "/get-dashboard-stats",
    authMiddleware,
    authorizeRole("admin"),
    asyncHandler(getAdminDashboardStats),
);

export default router;

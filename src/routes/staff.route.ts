import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllStaff, getStaffDashboardStats, getStaffTasks } from "../controllers/staff.controller.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
    "/get-all-staff",
    authMiddleware,
    authorizeRole("admin"),
    asyncHandler(getAllStaff),
);

router.get(
    "/get-assigned-tasks",
    authMiddleware,
    authorizeRole("staff"),
    asyncHandler(getStaffTasks),
);

router.get(
    "/get-dashboard-stats",
    authMiddleware,
    authorizeRole("staff"),
    getStaffDashboardStats,
);
export default router;

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";
import {
    createTask,
    getUserTasks,
    getAdminTasks,
    getTaskDetail,
    editTask,
    createTaskWithAi,
    getStaffTasks,
    deleteTask,
} from "../controllers/task.controller.js";

const router = Router();

router.get(
    "/get-user-tasks",
    authMiddleware,
    authorizeRole("user"),
    asyncHandler(getUserTasks),
);
router.post(
    "/create-task",
    authMiddleware,
    authorizeRole("admin", "staff"),
    asyncHandler(createTask),
);
router.get(
    "/get-admin-tasks",
    authMiddleware,
    authorizeRole("admin"),
    asyncHandler(getAdminTasks),
);
router.get(
    "/get-staff-tasks",
    authMiddleware,
    authorizeRole("staff", "admin"),
    asyncHandler(getStaffTasks),
);
router.get(
    "/get-task-detail/:taskId",
    authMiddleware,
    authorizeRole("admin", "staff"),
    asyncHandler(getTaskDetail),
);
router.put(
    "/edit-task/:taskId",
    authMiddleware,
    authorizeRole("admin", "staff"),
    asyncHandler(editTask),
);
router.post(
    "/create-task-ai",
    authMiddleware,
    authorizeRole("admin", "staff"),
    asyncHandler(createTaskWithAi),
);

router.delete(
    "/delete-task/:taskId",
    authMiddleware,
    authorizeRole("admin", "staff"),
    asyncHandler(deleteTask),
);
export default router;

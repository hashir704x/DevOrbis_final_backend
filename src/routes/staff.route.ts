import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllStaff } from "../controllers/staff.controller.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/get-all-staff",
  authMiddleware,
  authorizeRole("admin"),
  asyncHandler(getAllStaff),
);
export default router;

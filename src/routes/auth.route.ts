import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    getCurrentUser,
    login,
    logout,
    resendOtp,
    signup,
    verifyEmail,
} from "../controllers/auth.controller.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));

router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/resend-otp", asyncHandler(resendOtp));

router.post(
    "/get-current-user",
    authMiddleware,
    authorizeRole("admin", "staff", "user"),
    getCurrentUser,
);

router.get("/logout", logout);
export default router;

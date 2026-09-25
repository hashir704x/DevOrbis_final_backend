import { Router } from "express";
import { testError } from "../controllers/test.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const router = Router();

router.get("/error", asyncHandler(testError));

export default router;

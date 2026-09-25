import { Router } from "express";
import { upload, validateDocumentUpload } from "../middleware/upload.middleware.js";
import { getDocuments, uploadDocument } from "../controllers/document.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/upload",
  authMiddleware,
  authorizeRole("admin"),
  upload.single("document"),
  validateDocumentUpload,
  asyncHandler(uploadDocument),
);

router.get(
  "/get-documents",
  authMiddleware,
  authorizeRole("admin"),
  asyncHandler(getDocuments),
);

export default router;

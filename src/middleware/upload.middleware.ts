import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";

const upload = multer({
    storage: multer.memoryStorage(),
});

const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateDocumentUpload(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.file) {
        throw new AppError("No document uploaded", 400);
    }
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new AppError(
            "Invalid file type. Only PDF and DOCX files are allowed.",
            400,
        );
    }
    if (req.file.size > MAX_FILE_SIZE) {
        throw new AppError("File size must not exceed 10 MB", 400);
    }
    next();
}

export { upload };

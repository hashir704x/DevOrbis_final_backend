import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export const testError = async (req: Request, res: Response) => {
    throw new AppError("This is a test error", 400);
};


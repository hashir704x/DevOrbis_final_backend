import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { DrizzleQueryError } from "drizzle-orm";
import { NeonDbError } from "@neondatabase/serverless";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("Control reached error middleware");
  console.log(err);
  
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        errors[field] = issue.message;
      }
    }
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  if (err instanceof DrizzleQueryError) {
    if (err.cause instanceof NeonDbError) {
      if (
        err.cause.code === "23505" &&
        err.cause.constraint === "users_email_unique"
      ) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
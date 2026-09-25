import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { ApiResponse } from "../utils/apiResponse.js";
import type { JwtPayload, roles } from "../types/types.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.agentic_rag_access_token;

  if (!token) {
    return res.status(401).json(new ApiResponse(false, "Not authenticated", null));
  }
  const userData = verifyToken(token);
  if (!userData) {
    return res.status(401).json(new ApiResponse(false, "Not authenticated", null));
  }
  req.userData = userData;
  next();
}

export function authorizeRole(...allowedRoles: roles[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const userData = req.userData as JwtPayload;
    if (!allowedRoles.includes(userData.role)) {
      return res.status(403).json(new ApiResponse(false, "Access denied", null));
    }
    next();
  };
}

import jwt from "jsonwebtoken";
import type { roles, JwtPayload } from "../types/types.js";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not set in the .env file");
}

export const createToken = (userId: string, role: roles): string => {
  return jwt.sign({ userId, role }, JWT_SECRET_KEY, {
    expiresIn: "2d",
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded) ||
      !("role" in decoded)
    ) {
      return null;
    }
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch {
    return null;
  }
};

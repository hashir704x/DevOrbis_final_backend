import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../drizzle/database-client.js";
import { users } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";

export async function getAllStaff(req: Request, res: Response) {
  const allStaff = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "staff"));
  return res
    .status(200)
    .json(new ApiResponse(true, "Staff members fetched successfully", allStaff));
}

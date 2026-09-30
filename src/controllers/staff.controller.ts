import { and, count, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../drizzle/database-client.js";
import { tasks, users } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";
import type { JwtPayload } from "../types/types.js";

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

export async function getStaffTasks(req: Request, res: Response) {
    const userData = req.userData as JwtPayload;
    
    const userId = userData.userId;
    const staffTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.assignedTo, userId));
    return res
        .status(200)
        .json(new ApiResponse(true, "Staff tasks fetched successfully", staffTasks));
}

export async function getStaffDashboardStats(req: Request, res: Response) {
    const userData = req.userData as JwtPayload;
    const userId = userData.userId;
    const [totalTasks, pendingTasks, inProgressTasks, completedTasks] =
        await Promise.all([
            db
                .select({ count: count() })
                .from(tasks)
                .where(eq(tasks.assignedTo, userId)),

            db
                .select({ count: count() })
                .from(tasks)
                .where(
                    and(eq(tasks.assignedTo, userId), eq(tasks.status, "pending")),
                ),

            db
                .select({ count: count() })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.assignedTo, userId),
                        eq(tasks.status, "in_progress"),
                    ),
                ),

            db
                .select({ count: count() })
                .from(tasks)
                .where(
                    and(eq(tasks.assignedTo, userId), eq(tasks.status, "completed")),
                ),
        ]);
    return res.status(200).json(
        new ApiResponse(true, "Staff dashboard stats fetched successfully", {
            totalTasks: totalTasks[0]?.count ?? 0,
            pendingTasks: pendingTasks[0]?.count ?? 0,
            inProgressTasks: inProgressTasks[0]?.count ?? 0,
            completedTasks: completedTasks[0]?.count ?? 0,
        }),
    );
}
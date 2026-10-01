import type { Request, Response } from "express";
import { db } from "../drizzle/database-client.js";
import { count, eq } from "drizzle-orm";
import { leads, tasks, users } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { redis, REDIS_ADMIN_DASHBOARD_STATS_KEY } from "../utils/redis.js";

export async function getAdminDashboardStats(req: Request, res: Response) {
    const cachedStats = await redis.get(REDIS_ADMIN_DASHBOARD_STATS_KEY);
    if (cachedStats) {
        console.log("Data cached");
        return res
            .status(200)
            .json(
                new ApiResponse(
                    true,
                    "Admin dashboard stats fetched from cache",
                    JSON.parse(cachedStats),
                ),
            );
    }

    console.log("Data uncached");

    const [
        totalStaff,
        totalLeads,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
    ] = await Promise.all([
        db.select({ count: count() }).from(users).where(eq(users.role, "staff")),
        db.select({ count: count() }).from(leads),
        db.select({ count: count() }).from(tasks),
        db.select({ count: count() }).from(tasks).where(eq(tasks.status, "pending")),
        db
            .select({ count: count() })
            .from(tasks)
            .where(eq(tasks.status, "in_progress")),
        db
            .select({ count: count() })
            .from(tasks)
            .where(eq(tasks.status, "completed")),
    ]);

    const stats = {
        totalStaff: totalStaff[0]?.count ?? 0,
        totalLeads: totalLeads[0]?.count ?? 0,
        totalTasks: totalTasks[0]?.count ?? 0,
        pendingTasks: pendingTasks[0]?.count ?? 0,
        inProgressTasks: inProgressTasks[0]?.count ?? 0,
        completedTasks: completedTasks[0]?.count ?? 0,
    };

    await redis.set(REDIS_ADMIN_DASHBOARD_STATS_KEY, JSON.stringify(stats), "EX", 30);

    return res.status(200).json(
        new ApiResponse(true, "Admin dashboard stats fetched successfully", {
            stats,
        }),
    );
}

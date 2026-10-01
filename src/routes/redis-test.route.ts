import { eq } from "drizzle-orm";
import { redis } from "../utils/redis.js";
import type { Request, Response } from "express";
import { Router } from "express";
import { db } from "../drizzle/database-client.js";
import { users } from "../drizzle/schema.js";

export async function testRedis(req: Request, res: Response) {
    const userId = req.params.userId as string;
    console.log(userId);

    const cachedUser = await redis.get(`user:${userId}`);

    console.log("cached user", cachedUser);

    if (cachedUser) {
        return res.status(200).json({
            success: true,
            source: "redis",
            data: JSON.parse(cachedUser),
        });
    }

    const result = await db
        .select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role,
            isVerified: users.isVerified,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const user = result[0];
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    await redis.set(`user:${userId}`, JSON.stringify(user));

    return res.status(200).json({
        success: true,
        source: "database",
        data: user,
    });
}

const router = Router();
router.get("/redis-test/:userId", testRedis);

export default router;

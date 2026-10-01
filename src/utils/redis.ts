import "dotenv/config";
import { Redis } from "ioredis";
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
    throw new Error("REDIS URL not set in env");
}

export const redis = new Redis(REDIS_URL);

export const REDIS_ADMIN_DASHBOARD_STATS_KEY = "admin:dashboard:stats";

export async function invalidateAdminDashboardStats() {
    await redis.del(REDIS_ADMIN_DASHBOARD_STATS_KEY);
}

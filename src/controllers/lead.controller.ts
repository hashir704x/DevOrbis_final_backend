import { eq } from "drizzle-orm";
import { db } from "../drizzle/database-client.js";
import { leads, users } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";
import type { Request, Response } from "express";

export async function getAllLeads(req: Request, res: Response) {
    const allLeads = await db
        .select({
            id: leads.id,
            username: users.username,
            email: users.email,
            budget: leads.budget,
            projectDescription: leads.projectDescription,
        })
        .from(leads)
        .innerJoin(users, eq(leads.userId, users.id));
    
    return res
        .status(200)
        .json(new ApiResponse(true, "Leads fetched successfully", allLeads));
}

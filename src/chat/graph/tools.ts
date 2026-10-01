import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../drizzle/database-client.js";
import { leads, tasks } from "../../drizzle/schema.js";
import { invalidateAdminDashboardStats } from "../../utils/redis.js";

export function createLeadTools(userId: string) {
  const createLead = tool(
    async ({ budget, projectDescription }) => {
      console.log("create lead tool called");
      const existingLead = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.userId, userId))
        .limit(1);
      if (existingLead.length > 0) {
        return {
          success: false,
          message: "User is already a lead.",
        };
      }
      const [lead] = await db
        .insert(leads)
        .values({
          userId,
          budget,
          projectDescription,
        })
        .returning({ id: leads.id });
      if (!lead) {
        console.log("Error");
        throw new Error("Failed to create lead.");
      }
      await invalidateAdminDashboardStats();
      return {
        success: true,
        leadId: lead.id,
        message: "Lead created successfully.",
      };
    },
    {
      name: "createLead",
      description:
        "Creates a lead for the currently authenticated user after the user has explicitly confirmed they want to become a CodeNest lead. Requires the user's budget and project description.",
      schema: z.object({
        budget: z.string().nonempty(),
        projectDescription: z.string().min(1),
      }),
    },
  );
  return {
    createLead,
  };
}

export function createTasksTools(userId: string) {
  const getTasks = tool(
    async ({ status, priority }) => {
      console.log("get tasks tool called");
      const [userLead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.userId, userId))
        .limit(1);
      if (!userLead) {
        return {
          success: false,
          message: "User is not a lead.",
          tasks: [],
        };
      }
      const leadId = userLead.id;
      const conditions = [eq(tasks.leadId, leadId)];
      if (status) {
        conditions.push(eq(tasks.status, status));
      }
      if (priority) {
        conditions.push(eq(tasks.priority, priority));
      }
      const result = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(and(...conditions));
      return {
        success: true,
        tasks: result,
      };
    },
    {
      name: "getTasks",
      description:
        "Retrieves tasks belonging to the currently authenticated user's CodeNest lead. You can optionally filter tasks by status or priority. This tool is read-only and does not create, update, or delete tasks.",
      schema: z.object({
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }),
    },
  );
  return {
    getTasks,
  };
}

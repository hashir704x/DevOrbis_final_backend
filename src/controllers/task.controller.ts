import type { Request, Response } from "express";
import type { JwtPayload } from "../types/types.js";
import { db } from "../drizzle/database-client.js";
import { leads, tasks, users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
  creatTaskWithAiSchema,
  createTaskWithAiPromptSchema,
} from "../zod-schemas/tasks.schema.js";
import { AppError } from "../errors/AppError.js";
import { LLM } from "../utils/gemini-llm-model.js";

const leadUser = alias(users, "lead_user");
const assignedStaff = alias(users, "assigned_staff");
const taskCreatorLLM = LLM.withStructuredOutput(creatTaskWithAiSchema, {
  includeRaw: true,
});

export async function getUserTasks(req: Request, res: Response) {
  const userData = req.userData as JwtPayload;
  const userId = userData.userId;
  const [userLead] = await db
    .select({
      id: leads.id,
    })
    .from(leads)
    .where(eq(leads.userId, userId))
    .limit(1);

  if (!userLead) {
    return res.status(200).json(
      new ApiResponse(true, "User is not a lead", {
        isLead: false,
        tasks: [],
      }),
    );
  }

  const userTasks = await db
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
    .where(eq(tasks.leadId, userLead.id));

  return res.status(200).json(
    new ApiResponse(true, "Tasks fetched successfully", {
      isLead: true,
      tasks: userTasks,
    }),
  );
}

export async function getStaffTasks(req: Request, res: Response) {
  const userData = req.userData as JwtPayload;
  const staffTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      leadName: users.username,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .innerJoin(leads, eq(tasks.leadId, leads.id))
    .innerJoin(users, eq(leads.userId, users.id))
    .where(eq(tasks.assignedTo, userData.userId));
  return res
    .status(200)
    .json(new ApiResponse(true, "Tasks fetched successfully", staffTasks));
}

export async function getAdminTasks(req: Request, res: Response) {
  const allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      leadId: tasks.leadId,
      leadName: users.username,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .innerJoin(leads, eq(tasks.leadId, leads.id))
    .innerJoin(users, eq(leads.userId, users.id));
  return res
    .status(200)
    .json(new ApiResponse(true, "Tasks fetched successfully", allTasks));
}

export async function createTask(req: Request, res: Response) {
  const userData = req.userData as JwtPayload;

  const validatedData = createTaskSchema.parse(req.body);

  const { leadId, title, description, priority } = validatedData;

  const [lead] = await db
    .select({
      id: leads.id,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead) {
    throw new AppError("Failed to create task, lead not found", 404);
  }

  let assignedTo: string;

  if (userData.role === "staff") {
    assignedTo = userData.userId;
  } else {
    if (!validatedData.assignedTo) {
      throw new AppError(
        "A staff member must be selected when creating a task as an admin",
        404,
      );
    }

    assignedTo = validatedData.assignedTo;
  }

  const [createdTask] = await db
    .insert(tasks)
    .values({
      title,
      description,
      priority,
      assignedTo,
      leadId,
    })
    .returning({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      leadId: tasks.leadId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    });

  if (!createdTask) {
    throw new AppError("Failed to create task, problem at server side", 500);
  }
  const leadUser = alias(users, "lead_user");
  const assignedStaff = alias(users, "assigned_staff");

  const [taskDetails] = await db
    .select({
      assignedStaffName: assignedStaff.username,
      leadName: leadUser.username,
      leadEmail: leadUser.email,
    })
    .from(tasks)
    .innerJoin(leads, eq(tasks.leadId, leads.id))
    .innerJoin(leadUser, eq(leads.userId, leadUser.id))
    .innerJoin(assignedStaff, eq(tasks.assignedTo, assignedStaff.id))
    .where(eq(tasks.id, createdTask.id))
    .limit(1);

  if (!taskDetails) {
    throw new AppError("Task created but failed to fetch task details", 500);
  }

  await fetch("https://hashir704xdev.app.n8n.cloud/webhook-test/create-task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: createdTask.id,
      title: createdTask.title,
      description: createdTask.description,
      status: createdTask.status,
      priority: createdTask.priority,
      assignedTo: createdTask.assignedTo,
      assignedStaffName: taskDetails.assignedStaffName,
      leadId: createdTask.leadId,
      leadName: taskDetails.leadName,
      leadEmail: taskDetails.leadEmail,
      createdAt: createdTask.createdAt,
    }),
  });

  return res
    .status(201)
    .json(new ApiResponse(true, "Task created successfully", createdTask));
}

export async function getTaskDetail(req: Request, res: Response) {
  const { taskId } = taskIdSchema.parse(req.params);

  const task = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,

      assignedTo: tasks.assignedTo,
      assignedStaffName: assignedStaff.username,

      leadId: tasks.leadId,
      leadName: leadUser.username,
      leadEmail: leadUser.email,

      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .innerJoin(leads, eq(tasks.leadId, leads.id))
    .innerJoin(leadUser, eq(leads.userId, leadUser.id))
    .innerJoin(assignedStaff, eq(tasks.assignedTo, assignedStaff.id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!task[0]) {
    throw new AppError("Task not found", 404);
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "Task fetched successfully", task[0]));
}

export async function editTask(req: Request, res: Response) {
  const userData = req.userData as JwtPayload;
  const { taskId } = taskIdSchema.parse(req.params);
  const validatedData = updateTaskSchema.parse(req.body);
  const [existingTask] = await db
    .select({
      id: tasks.id,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!existingTask) {
    throw new AppError("Task not found", 404);
  }
  let assignedTo: string;
  if (userData.role === "staff") {
    assignedTo = userData.userId;
  } else {
    assignedTo = validatedData.assignedTo;
  }
  const [updatedTask] = await db
    .update(tasks)
    .set({
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      assignedTo,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      leadId: tasks.leadId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    });
  if (!updatedTask) {
    throw new AppError("Failed to edit the task, problem at server side", 500);
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "Task updated successfully", updatedTask));
}

export async function createTaskWithAi(req: Request, res: Response) {
  const { prompt } = createTaskWithAiPromptSchema.parse(req.body);
  const result = await taskCreatorLLM.invoke([
    {
      role: "system",
      content: `
        You are an AI task generation assistant.

        Generate a software development task based on the user's prompt.

        Return:
        - A clear and concise task title.
        - A useful task description with enough implementation context.
        - A priority of low, medium, or high.

        Do not generate lead information.
        Do not generate staff assignment information.
        Only generate the task title, description, and priority.
            `,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);
  // console.log("result", result);
  return res
    .status(200)
    .json(
      new ApiResponse(true, "Task fields generated successfully", result.parsed),
    );
}

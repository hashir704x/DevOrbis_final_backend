import { z } from "zod";

export const createTaskSchema = z.object({
  leadId: z.uuid(),
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedTo: z.uuid().optional(),
});

export const taskIdSchema = z.object({
  taskId: z.uuid("Invalid task ID"),
});

export const updateTaskSchema = z.object({
  title: z.string().nonempty("Task title is required"),
  description: z.string().nonempty("Task description is required"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "completed"]),
  assignedTo: z.uuid("Invalid staff member ID"),
});

export const creatTaskWithAiSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
});

export const createTaskWithAiPromptSchema = z.object({
  prompt: z.string().nonempty("For task creation, prompt is required"),
});

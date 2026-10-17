import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "./schema";

export async function createTask(input: unknown) {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: "Check the highlighted fields and try again.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const task = await prisma.task.create({ data: parsed.data });
    return { success: true as const, task };
  } catch {
    return {
      success: false as const,
      message: "We couldn't save your task. Your entries are still here. Please try again.",
    };
  }
}

export async function listTasks() {
  return prisma.task.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
}

const taskIdSchema = z.string().min(1);
const deleteTaskIdSchema = taskIdSchema.refine((value) => value.trim().length > 0);
const missingTaskMessage = "Task no longer exists. Your entries are still here.";

export async function updateTask(id: unknown, input: unknown) {
  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false as const, message: missingTaskMessage };
  }
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: "Check the highlighted fields and try again.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const task = await prisma.task.update({ where: { id: parsedId.data }, data: parsed.data });
    return { success: true as const, task };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return {
        success: false as const,
        message: missingTaskMessage,
      };
    }
    return {
      success: false as const,
      message: "We couldn't save your task. Your entries are still here. Please try again.",
    };
  }
}

export async function getTask(id: unknown) {
  const parsedId = taskIdSchema.safeParse(id);
  if (!parsedId.success) return null;
  return prisma.task.findUnique({ where: { id: parsedId.data } });
}

export async function deleteTask(id: unknown) {
  const parsedId = deleteTaskIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false as const,
      outcome: "invalid_id" as const,
      message: "We couldn't identify this task. Refresh the list and try again.",
    };
  }
  try {
    await prisma.task.delete({ where: { id: parsedId.data } });
    return { success: true as const, outcome: "deleted" as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: true as const, outcome: "already_absent" as const };
    }
    return {
      success: false as const,
      outcome: "delete_failed" as const,
      message: "We couldn't delete your task. Please try again.",
    };
  }
}

import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "./schema";

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


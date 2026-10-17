"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTask, deleteTask, updateTask } from "./operations";

export type TaskFields = {
  title: string;
  description: string;
  status: string;
  priority: string;
};

export type TaskFormState = {
  values?: TaskFields;
  errors?: Partial<Record<keyof TaskFields, string[]>>;
  message?: string;
};

function readTaskForm(formData: FormData) {
  const input = {
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    status: formData.get("status") ?? undefined,
    priority: formData.get("priority") ?? undefined,
  };
  const values = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  ) as TaskFields;
  return { input, values };
}

export async function createTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { input, values } = readTaskForm(formData);
  const result = await createTask(input);
  if (!result.success) {
    return { values, errors: result.errors, message: result.message };
  }
  revalidatePath("/");
  redirect("/?created=1");
}

export async function updateTaskAction(
  id: string,
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { input, values } = readTaskForm(formData);
  const result = await updateTask(id, input);
  if (!result.success) {
    return { values, errors: result.errors, message: result.message };
  }
  revalidatePath("/");
  revalidatePath(`/tasks/${id}/edit`);
  redirect("/?updated=1");
}

export type DeleteTaskResult = Awaited<ReturnType<typeof deleteTask>> & { refreshFailed?: boolean };

export async function deleteTaskAction(id: string): Promise<DeleteTaskResult> {
  const result = await deleteTask(id);
  if (!result.success) return result;

  // A cache failure cannot undo a deletion that PostgreSQL already confirmed.
  try {
    revalidatePath(`/tasks/${encodeURIComponent(id)}/edit`);
    revalidatePath("/");
  } catch {
    return { ...result, refreshFailed: true };
  }
  return result;
}

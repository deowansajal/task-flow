"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTask } from "./operations";

type TaskFields = {
  title: string;
  description: string;
  status: string;
  priority: string;
};

export type CreateTaskState = {
  values?: TaskFields;
  errors?: Partial<Record<keyof TaskFields, string[]>>;
  message?: string;
};

export async function createTaskAction(
  _previous: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const input = {
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    status: formData.get("status") ?? undefined,
    priority: formData.get("priority") ?? undefined,
  };
  const result = await createTask(input);
  if (!result.success) {
    const values = Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
    ) as TaskFields;
    return { values, errors: result.errors, message: result.message };
  }
  revalidatePath("/");
  redirect("/?created=1");
}

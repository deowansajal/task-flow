import { afterEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTask, getTask, updateTask } from "./operations";

afterEach(() => vi.restoreAllMocks());

it("rejects invalid creation input with field errors before trying to save", async () => {
  vi.spyOn(prisma.task, "create").mockRejectedValue(new Error("Database is unavailable"));
  expect(await createTask({ title: "   " })).toMatchObject({
    success: false,
    errors: { title: ["Enter a title."] },
  });
});

it("returns a retryable persistence error without leaking database details", async () => {
  vi.spyOn(prisma.task, "create").mockRejectedValue(new Error("password authentication failed for private-database"));
  expect(await createTask({ title: "Plan the week" })).toEqual({
    success: false,
    message: "We couldn't save your task. Your entries are still here. Please try again.",
  });
});

it("rejects invalid edits with field errors before trying to save", async () => {
  vi.spyOn(prisma.task, "update").mockRejectedValue(new Error("Database is unavailable"));
  expect(await updateTask("existing-task", { title: " ", status: "ARCHIVED", priority: "URGENT" }))
    .toMatchObject({
      success: false,
      errors: {
        title: ["Enter a title."],
        status: ["Choose a valid status."],
        priority: ["Choose a valid priority."],
      },
    });
});
it.each([undefined, null, "", 42, { id: "some-task" }])("handles an invalid task ID without querying the database: %j", async (id) => {
  vi.spyOn(prisma.task, "findUnique").mockRejectedValue(new Error("Unexpected database access"));
  vi.spyOn(prisma.task, "update").mockRejectedValue(new Error("Unexpected database access"));
  expect(await getTask(id)).toBeNull();
  expect(await updateTask(id, { title: "Plan", status: "TODO", priority: "MEDIUM" }))
    .toMatchObject({ success: false, message: "Task no longer exists. Your entries are still here." });
});
it("returns a retryable edit error without leaking database details", async () => {
  vi.spyOn(prisma.task, "update").mockRejectedValue(new Error("password authentication failed for private-database"));
  expect(await updateTask("existing-task", { title: "Plan", status: "IN_PROGRESS", priority: "HIGH" }))
    .toEqual({
      success: false,
      message: "We couldn't save your task. Your entries are still here. Please try again.",
    });
});

it("does not misrepresent a task-loading failure as a missing task", async () => {
  vi.spyOn(prisma.task, "findUnique").mockRejectedValue(new Error("Database unavailable"));
  await expect(getTask("existing-task")).rejects.toThrow("Database unavailable");
});

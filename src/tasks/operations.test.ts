import { afterEach, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createTask, deleteTask, getTask, updateTask } from "./operations";

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

it.each([undefined, null, "", " \n\t ", 42, {}, ["some-task"]])("rejects an invalid deletion ID before database access: %j", async (id) => {
  const remove = vi.spyOn(prisma.task, "delete").mockRejectedValue(new Error("Unexpected database access"));
  expect(await deleteTask(id)).toEqual({
    success: false,
    outcome: "invalid_id",
    message: "We couldn't identify this task. Refresh the list and try again.",
  });
  expect(remove).not.toHaveBeenCalled();
});
it("returns a recoverable deletion error without leaking persistence details", async () => {
  vi.spyOn(prisma.task, "delete").mockRejectedValue(new Error("password authentication failed for private-database"));
  expect(await deleteTask("existing-task")).toEqual({
    success: false,
    outcome: "delete_failed",
    message: "We couldn't delete your task. Please try again.",
  });
});
it("treats an already-absent task as a completed deletion request", async () => {
  vi.spyOn(prisma.task, "delete").mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
    "Private database details", { code: "P2025", clientVersion: "7.10.1" },
  ));
  expect(await deleteTask("missing-task")).toEqual({ success: true, outcome: "already_absent" });
});

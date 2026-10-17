import { afterEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTask } from "./operations";

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

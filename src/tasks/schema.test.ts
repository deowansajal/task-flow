import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "./schema";

describe("task creation input", () => {
  it("trims a required title and supplies the default status and priority", () => {
    expect(createTaskSchema.parse({ title: "  Plan the week  " })).toEqual({
      title: "Plan the week",
      description: null,
      status: "TODO",
      priority: "MEDIUM",
    });
    expect(createTaskSchema.safeParse({ title: "   " }).success).toBe(false);
  });
});

it("enforces the title and description limits after trimming only the title", () => {
  expect(createTaskSchema.safeParse({ title: " " + "a".repeat(120) + " ", description: "d".repeat(1000) }).success).toBe(true);
  expect(createTaskSchema.safeParse({ title: "a".repeat(121) }).success).toBe(false);
  expect(createTaskSchema.safeParse({ title: "Plan", description: "d".repeat(1001) }).success).toBe(false);
});

it("treats whitespace-only descriptions as empty and preserves meaningful plain text", () => {
  expect(createTaskSchema.parse({ title: "Plan", description: " \n\t " }).description).toBeNull();
  expect(createTaskSchema.parse({ title: "Plan", description: "  <b>Keep plain text</b>\n " }).description).toBe("  <b>Keep plain text</b>\n ");
});

it.each([1000, 1001])("validates a %i-character multiline description after multipart transport", async (length) => {
  const description = "a".repeat(length - 2) + "\nb";
  const body = new FormData();
  body.set("description", description);
  const request = new Request("http://localhost/tasks/new", { method: "POST", body });
  const received = (await request.formData()).get("description");

  expect(received).toBe(description.replace(/\n/g, "\r\n"));
  const result = createTaskSchema.safeParse({ title: "Plan", description: received });
  expect(result.success).toBe(length <= 1000);
  if (result.success) expect(result.data.description).toBe(description);
});

it.each([
  {},
  { title: null },
  { title: 42 },
  { title: "" },
  { title: "Plan", description: 42 },
  { title: "Plan", status: "ARCHIVED" },
  { title: "Plan", priority: "URGENT" },
])("rejects missing titles, non-text fields, and unsupported status or priority: %j", (input) => {
  expect(createTaskSchema.safeParse(input).success).toBe(false);
});

it("allows choosing status and priority before saving", () => {
  expect(createTaskSchema.parse({ title: "Plan", status: "IN_PROGRESS", priority: "HIGH" })).toMatchObject({
    status: "IN_PROGRESS", priority: "HIGH",
  });
});

it("requires explicit status and priority when editing instead of applying creation defaults", () => {
  const result = updateTaskSchema.safeParse({ title: "Plan" });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.map((issue) => issue.path)).toEqual([["status"], ["priority"]]);
  }
  expect(updateTaskSchema.parse({ title: "  Revised plan  ", status: "DONE", priority: "LOW" }))
    .toEqual({ title: "Revised plan", description: null, status: "DONE", priority: "LOW" });
});
it.each([
  { title: "" },
  { title: " \n\t " },
  { title: null },
  { title: 42 },
  { title: "a".repeat(121) },
  { description: "d".repeat(1001) },
  { description: 42 },
  { status: undefined },
  { status: null },
  { status: "ARCHIVED" },
  { priority: undefined },
  { priority: null },
  { priority: "URGENT" },
])("rejects invalid edit fields: %j", (changes) => {
  expect(updateTaskSchema.safeParse({ title: "Plan", status: "TODO", priority: "MEDIUM", ...changes }).success)
    .toBe(false);
});

it("shares Create's text limits and normalization when editing", () => {
  const input = {
    title: " " + "a".repeat(120) + " ", description: "d".repeat(998) + "\r\nx",
    status: "IN_PROGRESS", priority: "HIGH",
  };
  expect(updateTaskSchema.parse(input)).toEqual({
    title: "a".repeat(120), description: "d".repeat(998) + "\nx",
    status: "IN_PROGRESS", priority: "HIGH",
  });
  expect(updateTaskSchema.parse({ ...input, description: " \r\n\t " }).description).toBeNull();
  expect(updateTaskSchema.parse({ ...input, description: "  <b>Keep plain text</b>\r\n " }).description)
    .toBe("  <b>Keep plain text</b>\n ");
});

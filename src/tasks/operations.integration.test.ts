import { afterAll, beforeAll, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTask, getTask, listTasks, updateTask } from "./operations";

const createdIds: string[] = [];

beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (process.env.TASKFLOW_INTEGRATION !== "1" || !url.pathname.endsWith("_test")) {
    throw new Error("Run through npm run test:integration against a separate test database.");
  }
});

afterAll(async () => {
  // Delete only fixtures created by this run; never reset the database.
  if (createdIds.length) await prisma.task.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

it("a created task is retrievable after reconnecting, with defaults and generated timestamps", async () => {
  const title = `Create Task integration ${crypto.randomUUID()}`;
  const result = await createTask({ title: `  ${title}  `, description: "Prepare a weekly plan." });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  expect(result.task).toMatchObject({
    id: expect.any(String),
    title,
    description: "Prepare a weekly plan.",
    status: "TODO",
    priority: "MEDIUM",
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
  expect(Number.isNaN(result.task.createdAt.getTime())).toBe(false);
  expect(result.task.updatedAt.getTime()).toBeGreaterThanOrEqual(result.task.createdAt.getTime());
  await prisma.$disconnect();
  expect(await listTasks()).toContainEqual(result.task);
});

it("persists an optional description and explicitly selected status and priority", async () => {
  const result = await createTask({ title: "Chosen values", status: "DONE", priority: "LOW" });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  expect(result.task).toMatchObject({ description: null, status: "DONE", priority: "LOW" });
  expect(await listTasks()).toContainEqual(result.task);
});

it("invalid input is rejected without changing the persisted task list", async () => {
  const before = await listTasks();
  expect(await createTask({ title: " ", description: "d".repeat(1001) })).toMatchObject({
    success: false,
    errors: { title: expect.any(Array), description: expect.any(Array) },
  });
  expect(await listTasks()).toEqual(before);
});

it("lists tasks newest first by creation time rather than insertion order", async () => {
  const fixtures = [
    { title: "Oldest task", createdAt: new Date("2026-01-01T00:00:00Z") },
    { title: "Newest task", createdAt: new Date("2026-01-03T00:00:00Z") },
    { title: "Middle task", createdAt: new Date("2026-01-02T00:00:00Z") },
  ];
  const fixtureIds: string[] = [];
  for (const data of fixtures) {
    const task = await prisma.task.create({ data });
    createdIds.push(task.id);
    fixtureIds.push(task.id);
  }

  const tasks = await listTasks();
  expect(tasks.filter((task) => fixtureIds.includes(task.id)).map((task) => task.id))
    .toEqual([fixtureIds[1], fixtureIds[2], fixtureIds[0]]);
});

it("edits a task durably without changing its identity, creation time, or other tasks", async () => {
  const original = await createTask({ title: "Original task", description: "Old details" });
  if (!original.success) throw new Error(original.message);
  createdIds.push(original.task.id);
  const other = await createTask({ title: "Another task" });
  if (!other.success) throw new Error(other.message);
  createdIds.push(other.task.id);

  const result = await updateTask(original.task.id, {
    title: "  Revised task  ", description: "  New details\r\n<b>Plain text</b>  ",
    status: "DONE", priority: "HIGH",
    id: other.task.id, createdAt: new Date("2000-01-01T00:00:00Z"),
    updatedAt: new Date("2000-01-01T00:00:00Z"),
  });
  if (!result.success) throw new Error(result.message);
  expect(result.task).toMatchObject({
    id: original.task.id, title: "Revised task", description: "  New details\n<b>Plain text</b>  ",
    status: "DONE", priority: "HIGH", createdAt: original.task.createdAt,
  });
  expect(result.task.updatedAt.getTime()).toBeGreaterThan(original.task.updatedAt.getTime());
  await prisma.$disconnect();
  expect(await getTask(original.task.id)).toEqual(result.task);
  expect(await getTask(other.task.id)).toEqual(other.task);
  const tasks = await listTasks();
  expect(tasks.filter((task) => [original.task.id, other.task.id].includes(task.id)).map((task) => task.id))
    .toEqual([other.task.id, original.task.id]);
});
it("reports missing tasks on load and save, including deletion after loading", async () => {
  const missingId = `missing-${crypto.randomUUID()}`;
  expect(await getTask(missingId)).toBeNull();
  expect(await updateTask(missingId, { title: "Missing", status: "TODO", priority: "MEDIUM" }))
    .toMatchObject({ success: false, message: "Task no longer exists. Your entries are still here." });

  const result = await createTask({ title: "Deleted after loading" });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  expect(await getTask(result.task.id)).toEqual(result.task);
  await prisma.task.delete({ where: { id: result.task.id } });
  expect(await updateTask(result.task.id, { title: "Unsaved changes", status: "DONE", priority: "LOW" }))
    .toMatchObject({ success: false, message: "Task no longer exists. Your entries are still here." });
  expect(await getTask(result.task.id)).toBeNull();
});
it.each([
  ["TODO", "TODO"], ["TODO", "IN_PROGRESS"], ["TODO", "DONE"],
  ["IN_PROGRESS", "TODO"], ["IN_PROGRESS", "IN_PROGRESS"], ["IN_PROGRESS", "DONE"],
  ["DONE", "TODO"], ["DONE", "IN_PROGRESS"], ["DONE", "DONE"],
] as const)("allows editing status from %s to %s", async (from, to) => {
  const result = await createTask({ title: "Status transition", status: from });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  expect(await updateTask(result.task.id, { title: "Status transition", status: to, priority: "MEDIUM" }))
    .toMatchObject({ success: true, task: { status: to } });
  expect(await getTask(result.task.id)).toMatchObject({ status: to });
});

it("rejects invalid edits without changing any persisted task", async () => {
  const result = await createTask({ title: "Keep original", description: "Keep details", status: "DONE", priority: "HIGH" });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  const before = await listTasks();
  expect(await updateTask(result.task.id, { title: " ", description: "d".repeat(1001), status: "DONE" }))
    .toMatchObject({ success: false, errors: { title: expect.any(Array), description: expect.any(Array), priority: expect.any(Array) } });
  expect(await listTasks()).toEqual(before);
});

it.each(["", " \n\t "])("clears an existing description to null when saved as %j", async (description) => {
  const result = await createTask({ title: "Clear details", description: "Previously saved details" });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  expect(await updateTask(result.task.id, { title: "Clear details", description, status: "TODO", priority: "MEDIUM" }))
    .toMatchObject({ success: true, task: { description: null } });
  expect(await getTask(result.task.id)).toMatchObject({ description: null });
});

it("accepts unchanged saves and lets the last successful save win, including all priorities", async () => {
  const result = await createTask({ title: "Initial values", description: "Initial details" });
  if (!result.success) throw new Error(result.message);
  createdIds.push(result.task.id);
  const originalInput = { title: "Initial values", description: "Initial details", status: "TODO", priority: "MEDIUM" };
  expect(await updateTask(result.task.id, originalInput)).toMatchObject({ success: true });
  for (const priority of ["LOW", "MEDIUM", "HIGH"]) {
    expect(await updateTask(result.task.id, { ...originalInput, title: "More recent change", priority }))
      .toMatchObject({ success: true });
    expect(await getTask(result.task.id)).toMatchObject({ title: "More recent change", priority });
  }
  // A stale form can overwrite newer changes, as required for this version.
  expect(await updateTask(result.task.id, originalInput)).toMatchObject({ success: true });
  expect(await getTask(result.task.id)).toMatchObject(originalInput);
});

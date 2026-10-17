import { afterAll, beforeAll, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTask, listTasks } from "./operations";

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

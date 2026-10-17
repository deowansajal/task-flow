import Link from "next/link";
import { Suspense } from "react";
import { listTasks } from "@/tasks/operations";
import { TaskListView } from "@/tasks/task-list";

async function TaskList() {
  let tasks;
  try {
    tasks = await listTasks();
  } catch {
    return <TaskListView tasks={null} />;
  }
  return <TaskListView tasks={tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
  }))} />;
}

async function SuccessMessage({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const message = params.updated === "1" ? "Task updated successfully."
    : params.created === "1" ? "Task created successfully." : null;
  return message ? <p role="status" className="mb-6 rounded-xl bg-emerald-50 p-4 text-emerald-900">{message}</p> : null;
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="page-shell max-w-4xl">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">TaskFlow</p>
          <h1>Your tasks</h1>
          <p className="mt-2 text-slate-600">A little clarity for what comes next.</p>
        </div>
        <Link href="/tasks/new" className="button-primary">Add task</Link>
      </header>
      <Suspense fallback={null}><SuccessMessage searchParams={searchParams} /></Suspense>
      <Suspense fallback={<p role="status" className="card">Loading tasks...</p>}><TaskList /></Suspense>
    </main>
  );
}

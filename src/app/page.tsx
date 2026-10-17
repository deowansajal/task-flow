import Link from "next/link";
import { Suspense } from "react";
import { listTasks } from "@/tasks/operations";

const statusLabels = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };
const priorityLabels = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

async function TaskList() {
  let tasks;
  try {
    tasks = await listTasks();
  } catch {
    return (
      <div className="card" role="alert">
        <h2 className="text-lg font-semibold">We couldn&apos;t load your tasks.</h2>
        <p className="my-3 text-slate-600">Please try again in a moment.</p>
        <form action="/"><button type="submit" className="button-secondary">Retry</button></form>
      </div>
    );
  }
  if (!tasks.length) {
    return (
      <div className="card py-14 text-center">
        <h2 className="text-xl font-semibold">No tasks yet</h2>
        <p className="mt-2 text-slate-600">Start with one thing you&apos;d like to get done.</p>
        <Link href="/tasks/new" className="button-secondary mt-5">Create your first task</Link>
      </div>
    );
  }
  return (
    <ul aria-label="Tasks" className="space-y-4">
      {tasks.map((task) => (
        <li key={task.id} className="card min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">{task.title}</h2>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-indigo-800">{statusLabels[task.status]}</span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">Priority: {priorityLabels[task.priority]}</span>
            </div>
          </div>
          {task.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{task.description}</p>}
          <p className="mt-4 text-xs text-slate-500">
            Created <time dateTime={task.createdAt.toISOString()}>{task.createdAt.toISOString().slice(0, 10)}</time>
          </p>
        </li>
      ))}
    </ul>
  );
}

async function SuccessMessage({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  return params.created === "1" ? <p role="status" className="mb-6 rounded-xl bg-emerald-50 p-4 text-emerald-900">Task created successfully.</p> : null;
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

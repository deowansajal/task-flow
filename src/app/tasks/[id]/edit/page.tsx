import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateTaskAction } from "@/tasks/actions";
import { getTask } from "@/tasks/operations";
import { TaskForm } from "@/tasks/task-form";

async function EditTaskForm({ params }: Pick<PageProps<"/tasks/[id]/edit">, "params">) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  return (
    <TaskForm key={task.id} saveAction={updateTaskAction.bind(null, task.id)} initialValues={{
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
    }} />
  );
}

export default function EditTaskPage({ params }: PageProps<"/tasks/[id]/edit">) {
  return (
    <main className="page-shell max-w-2xl">
      <Link href="/" className="text-sm font-medium text-indigo-700">Back to tasks</Link>
      <header className="my-8">
        <p className="eyebrow">TaskFlow</p>
        <h1>Edit task</h1>
        <p className="mt-2 text-slate-600">Update the details of your next step.</p>
      </header>
      <Suspense fallback={<p role="status" className="card">Loading task...</p>}>
        <EditTaskForm params={params} />
      </Suspense>
    </main>
  );
}

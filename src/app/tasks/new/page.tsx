import Link from "next/link";
import { TaskForm } from "@/tasks/task-form";
import { createTaskAction } from "@/tasks/actions";

export default function NewTaskPage() {
  return (
    <main className="page-shell max-w-2xl">
      <Link href="/" className="text-sm font-medium text-indigo-700">Back to tasks</Link>
      <header className="my-8">
        <p className="eyebrow">TaskFlow</p>
        <h1>Create task</h1>
        <p className="mt-2 text-slate-600">Give your next step a place to start.</p>
      </header>
      <TaskForm saveAction={createTaskAction} initialValues={{ title: "", description: "", status: "TODO", priority: "MEDIUM" }} />
    </main>
  );
}

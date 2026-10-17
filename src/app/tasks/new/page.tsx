import Link from "next/link";
import { CreateTaskForm } from "@/tasks/create-task-form";

export default function NewTaskPage() {
  return (
    <main className="page-shell max-w-2xl">
      <Link href="/" className="text-sm font-medium text-indigo-700">Back to tasks</Link>
      <header className="my-8">
        <p className="eyebrow">TaskFlow</p>
        <h1>Create task</h1>
        <p className="mt-2 text-slate-600">Give your next step a place to start.</p>
      </header>
      <CreateTaskForm />
    </main>
  );
}

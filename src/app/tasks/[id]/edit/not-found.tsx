import Link from "next/link";

export default function TaskNotFound() {
  return (
    <main className="page-shell max-w-2xl">
      <div className="card space-y-4">
        <h1>Task not found</h1>
        <p className="text-slate-600">This task does not exist or has been deleted.</p>
        <Link href="/" className="button-secondary">Back to tasks</Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function EditTaskError({ retry }: { retry: () => void }) {
  return (
    <main className="page-shell max-w-2xl">
      <div className="card space-y-4" role="alert">
        <h1>We couldn&apos;t load your task.</h1>
        <p className="text-slate-600">Please try again in a moment.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={retry} className="button-primary">Retry</button>
          <Link href="/" className="button-secondary">Back to tasks</Link>
        </div>
      </div>
    </main>
  );
}

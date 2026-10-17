"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteTaskAction } from "./actions";
import type { DeleteTaskResult } from "./actions";

const statusLabels = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };
const priorityLabels = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: keyof typeof statusLabels;
  priority: keyof typeof priorityLabels;
  createdAt: string;
};

export function TaskListView({ tasks }: { tasks: TaskListItem[] | null }) {
  const [selected, setSelected] = useState<Pick<TaskListItem, "id" | "title"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ outcome: "deleted" | "already_absent"; refreshFailed?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useRef<HTMLHeadingElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterDeletion = useRef<string[] | null>(null);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      cancelButton.current?.focus();
    }
  }, [selected]);

  useEffect(() => {
    if (pending && dialog.current?.open) {
      dialogTitle.current?.focus();
    } else if (error) {
      errorSummary.current?.focus();
    } else if (!selected && !pending && focusAfterDeletion.current) {
      const candidates = [...focusAfterDeletion.current, ...(tasks?.map((task) => task.id) ?? [])];
      const nextButton = candidates
        .map((id) => deleteButtons.current.get(id)).find((button) => button?.isConnected);
      (nextButton ?? listHeading.current)?.focus();
      focusAfterDeletion.current = null;
    }
  }, [pending, error, selected, tasks]);

  function cancelDeletion() {
    if (submitting.current || pending) return;
    dialog.current?.close();
    setSelected(null);
    (trigger.current?.isConnected ? trigger.current : listHeading.current)?.focus();
  }

  function confirmDeletion() {
    if (!selected || submitting.current || pending) return;
    submitting.current = true;
    setError(null);
    const task = selected;
    const index = tasks?.findIndex((item) => item.id === task.id) ?? -1;
    const focusCandidates = index < 0 || !tasks ? [] : [
      ...tasks.slice(index + 1).map((item) => item.id),
      ...tasks.slice(0, index).reverse().map((item) => item.id),
    ];

    startTransition(async () => {
      try {
        let result: DeleteTaskResult;
        try {
          result = await deleteTaskAction(task.id);
        } catch {
          // A lost response does not tell us whether the database committed.
          setError("We couldn't confirm deletion. Refresh the list or try again.");
          return;
        }
        if (!result.success) {
          setError(result.message);
          return;
        }
        focusAfterDeletion.current = focusCandidates;
        setNotice({ outcome: result.outcome, refreshFailed: result.refreshFailed });
        dialog.current?.close();
        setSelected(null);
      } finally {
        submitting.current = false;
      }
    });
  }

  return (
    <div>
      <h2 ref={listHeading} tabIndex={-1} className="sr-only focus:not-sr-only focus:mb-4 focus:text-lg focus:font-semibold">Task list</h2>
      <p role="status" aria-atomic="true"
        className={notice ? "mb-6 rounded-xl bg-emerald-50 p-4 text-emerald-900" : "sr-only"}>
        {notice && <>
          {notice.outcome === "deleted" ? "Task deleted successfully." : "Task no longer exists."}
          {notice.refreshFailed || tasks === null
            ? " Refresh the list to see the latest tasks."
            : notice.outcome === "already_absent" ? " The list has been refreshed." : ""}
        </>}
      </p>
      {notice?.refreshFailed && tasks !== null && (
        <form action="/" className="mb-6"><button type="submit" className="button-secondary">Refresh task list</button></form>
      )}
      {tasks === null ? (
        <div className="card" role="alert">
          <h2 className="text-lg font-semibold">We couldn&apos;t load your tasks.</h2>
          <p className="my-3 text-slate-600">Please try again in a moment.</p>
          <form action="/"><button type="submit" className="button-secondary">Retry</button></form>
        </div>
      ) : !tasks.length ? (
        <div className="card py-14 text-center">
          <h2 className="text-xl font-semibold">No tasks yet</h2>
          <p className="mt-2 text-slate-600">Start with one thing you&apos;d like to get done.</p>
          <Link href="/tasks/new" className="button-secondary mt-5">Create your first task</Link>
        </div>
      ) : (
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
                Created <time dateTime={task.createdAt}>{task.createdAt.slice(0, 10)}</time>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/tasks/${task.id}/edit`} className="button-secondary" aria-label={`Edit task: ${task.title}`}>Edit task</Link>
                <button type="button" className="button-secondary text-red-700" aria-label={`Delete task: ${task.title}`}
                  disabled={pending}
                  ref={(button) => {
                    if (button) deleteButtons.current.set(task.id, button);
                    else deleteButtons.current.delete(task.id);
                  }}
                  onClick={(event) => {
                    if (submitting.current || pending) return;
                    trigger.current = event.currentTarget;
                    setError(null);
                    setNotice(null);
                    setSelected({ id: task.id, title: task.title });
                  }}>
                  Delete task
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <dialog ref={dialog} aria-labelledby="delete-task-title" aria-describedby="delete-task-description"
        aria-modal="true" className="delete-dialog"
        onCancel={(event) => {
          event.preventDefault();
          cancelDeletion();
        }}>
        <h2 id="delete-task-title" ref={dialogTitle} tabIndex={-1} className="text-xl font-semibold">Delete task?</h2>
        <p id="delete-task-description" className="mt-3 text-slate-600 [overflow-wrap:anywhere]">
          Permanently delete &ldquo;{selected?.title}&rdquo;? This cannot be undone.
        </p>
        <p ref={errorSummary} tabIndex={-1} role="alert" className={error ? "error-summary mt-4" : "sr-only"}>
          {error}
        </p>
        <form onSubmit={(event) => { event.preventDefault(); confirmDeletion(); }} className="mt-6">
          <fieldset disabled={pending} aria-busy={pending} className="flex flex-col gap-3 sm:flex-row">
            <legend className="sr-only">Confirm task deletion</legend>
            <button ref={cancelButton} type="button" className="button-secondary" disabled={pending} onClick={cancelDeletion}>Cancel</button>
            <button type="submit" className="button-danger" disabled={pending}>
              {pending ? "Deleting task..." : error ? "Retry deletion" : "Delete task"}
            </button>
          </fieldset>
        </form>
        <p role="status" aria-atomic="true" className="mt-3 text-sm text-slate-600">
          {pending ? "Deleting your task. Please wait." : ""}
        </p>
        {error && <form action="/" className="mt-3"><button type="submit" className="button-secondary">Refresh task list</button></form>}
      </dialog>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { TaskFields, TaskFormState } from "./actions";

export function TaskForm({ initialValues, saveAction }: {
  initialValues: TaskFields;
  saveAction: (previous: TaskFormState, formData: FormData) => Promise<TaskFormState>;
}) {
  const [state, action, pending] = useActionState<TaskFormState, FormData>(saveAction, {});
  const [values, setValues] = useState(state.values ?? initialValues);
  const errorSummary = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.message) errorSummary.current?.focus();
  }, [state]);

  return (
    <form action={action} noValidate className="card space-y-6">
      {state.message && (
        <p ref={errorSummary} tabIndex={-1} role="alert" className="error-summary">
          {state.message}
        </p>
      )}
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        <legend className="sr-only">Task details</legend>
        <div>
          <label htmlFor="title">Title <span className="text-slate-500">(required)</span></label>
          <input id="title" name="title" required autoComplete="off"
            value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })}
            aria-invalid={Boolean(state.errors?.title)} aria-describedby="title-hint title-error" />
          <p id="title-hint" className="hint">A clear next step. Up to 120 characters after trimming.</p>
          <p id="title-error" className="field-error">{state.errors?.title?.join(" ")}</p>
        </div>
        <div>
          <label htmlFor="description">Description <span className="text-slate-500">(optional)</span></label>
          <textarea id="description" name="description" rows={5} maxLength={1000}
            value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })}
            aria-invalid={Boolean(state.errors?.description)} aria-describedby="description-hint description-error" />
          <p id="description-hint" className="hint">Plain text, up to 1,000 characters.</p>
          <p id="description-error" className="field-error">{state.errors?.description?.join(" ")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={values.status}
              onChange={(event) => setValues({ ...values, status: event.target.value })}
              aria-invalid={Boolean(state.errors?.status)} aria-describedby="status-error">
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
            <p id="status-error" className="field-error">{state.errors?.status?.join(" ")}</p>
          </div>
          <div>
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={values.priority}
              onChange={(event) => setValues({ ...values, priority: event.target.value })}
              aria-invalid={Boolean(state.errors?.priority)} aria-describedby="priority-error">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <p id="priority-error" className="field-error">{state.errors?.priority?.join(" ")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <button type="submit" className="button-primary" disabled={pending}>
            {pending ? "Saving task..." : "Save task"}
          </button>
          {pending ? <span className="button-secondary text-slate-400">Cancel</span> : <Link href="/" className="button-secondary">Cancel</Link>}
          <span role="status" className="hint">{pending ? "Saving your task. Please wait." : ""}</span>
        </div>
      </fieldset>
    </form>
  );
}

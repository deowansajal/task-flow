# Edit Task verification

## Automated checks

The agreed seams are Zod schemas and public task operations. Run `npm test`,
`npm run test:integration`, `npm run lint`, `npm run typecheck`, and `npm run build`.
Integration tests use the guarded, separate PostgreSQL test database, verify
saved edits through `getTask` and `listTasks`, and delete only their own fixtures.
No schema migration, new dependency, or browser automation is needed for editing.

Tests cover explicit edit choices versus creation defaults, shared text rules,
all status transitions, all priorities, unchanged saves, clearing descriptions,
missing and deleted tasks, malformed IDs, safe database failures, immutable
identity and creation time, updated timestamps, list ordering, and last-save-wins.
These checks do not establish browser interaction or accessibility behavior.

## Manual browser checklist

Run the application against local development PostgreSQL. Use disposable tasks
for checks that change or remove data. Also rerun the Create Task checklist
because creation and editing now share the form.

- Follow Edit task from `/`; confirm `/tasks/<id>/edit` and all four saved values,
  including an empty textarea for a null description. Open the URL directly too.
- Edit all four fields and Save. Confirm return to `/`, the update-success message,
  fresh task values, unchanged creation date, and unchanged newest-first position.
  Refresh the page to confirm persistence.
- Move a task through To do, In progress, and Done, then reopen it. Change priority
  independently of status. Save an unchanged form successfully.
- Clear a saved description, Save, and reopen the form: the textarea is empty.
- Submit a blank or whitespace-only title; confirm its field error, preserved
  values in every field, and focus on the error summary. Correct it and retry.
- Try titles with 120 and 121 characters after trimming, and multiline descriptions
  at 1,000 characters. The textarea caps typing at 1,000; server tests cover
  oversized and malformed requests that bypass browser controls.
- Enter `<script>alert(1)</script>` as description text. Save and reopen it;
  the list and form display plain text without executing it.
- Change fields and Cancel or follow Back to tasks: return to `/` without saving.
- During Save, confirm fields, Save, and Cancel are disabled and saving status
  is announced. Failed Save re-enables the form and retains entered values.
- Stop only development PostgreSQL with `docker compose stop postgres` while the
  form is open. Save: see a retryable error and retain all entries. Restart with
  `docker compose start postgres`, retry, and confirm persistence.
- With development PostgreSQL stopped, open an edit URL directly: see the loading
  error rather than Task not found. Restart it and use Retry to load the task.
- Open `/tasks/nonexistent-task/edit`: see Task not found and Back to tasks.
  Streamed Next.js not-found responses can use HTTP 200 with `noindex` metadata.
- Open a disposable task's edit form, then delete that task using a database client.
  Save: see "Task no longer exists", retain unsaved entries, and confirm the task
  is not recreated. Reload the URL to see the not-found page.
- Open the same task in two tabs. Save different changes from each; the second
  successful save wins without a conflict prompt.
- Navigate between different task edit pages: each form has the correct task's
  values. Use keyboard only; confirm labels, field-error associations, visible
  focus, error-summary focus, and pending announcements.
- Check 320px, 375px, 768px, and desktop widths, including long unbroken text:
  no horizontal scrolling or clipped fields, buttons, or Edit links.

## Phase scope

Save and Cancel return to `/`, the current unfiltered, newest-first list. Filter
and sort controls and retaining their URL state remain a later phase. The shared
form does not add authentication, optimistic saves, or conflict detection.

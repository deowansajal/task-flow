# Create Task verification

Automated seams agreed in `docs/taskflow-requirements.md`: Zod validation and
public task operations. Vitest fast tests use a database-boundary failure stub;
integration tests use a separate PostgreSQL database and verify persistence
through `listTasks`, including reconnecting before reading. No browser
automation is added.

## Manual browser checklist

Run the app against local development PostgreSQL. These checks require a
browser and are not implied by passing Vitest, lint, typecheck, or build.

- Open `/` with an empty database: see "No tasks yet" and Add task.
- Follow Add task to `/tasks/new`; confirm TODO and MEDIUM defaults.
- Save a title with surrounding spaces and an optional multiline description.
  Confirm the success message, trimmed title, description, status and priority.
- Refresh and restart the app: the task remains visible.
- Save without a description. Save another task with Done and Low selected.
- Submit a blank or whitespace-only title. Confirm the understandable field
  error, its association to the control, and preserved entered values.
- Submit titles of 120 and 121 characters; accept only the former after trim.
  Confirm a 1,000-character description is accepted. The textarea caps typing
  at 1,000; the server also rejects longer or malformed requests.
- Stop only development PostgreSQL with `docker compose stop postgres`.
  Try Save: see a retryable error and retain all fields. Restart it with
  `docker compose start postgres`, then retry and confirm one saved task.
- While PostgreSQL is stopped, load `/`: see a loading error and Retry.
  Restart PostgreSQL and use Retry; tasks should return.
- During Save, confirm repeat submissions and form editing are disabled.
- Cancel a filled form: return to `/` without creating a task.
- Enter plain text such as `<script>alert(1)</script>` in the description:
  display it as text without execution.
- Use keyboard only: reach every control, Save, Cancel and Retry; visible focus
  should follow navigation and move to the error summary on failed Save.
- Inspect at 320px, 375px, 768px, and desktop widths, including long unbroken
  titles and descriptions: no horizontal scroll or clipped controls.

## Scope

The full product requirements include editing, deleting, filtering and sorting
controls. This slice implements creation and newest-first display only. It
keeps dedicated pages and the existing status/priority choices. The current
request supersedes the old text limits with 120 and 1,000 characters.

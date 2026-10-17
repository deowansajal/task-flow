# TaskFlow

A personal task list built with Next.js App Router, TypeScript, PostgreSQL,
Prisma, Zod, Vitest, and Tailwind CSS. This slice creates, edits, and deletes tasks and displays
saved tasks. It runs locally or behind restricted access, without accounts.

## Local setup

Use Node.js 24 and Docker Desktop with Docker Compose.

1. Run `npm ci`.
2. Copy `.env.example` to `.env`. Choose a local PostgreSQL password and put
   the same password in `POSTGRES_PASSWORD` and both connection URLs.
   URL-encode special characters in connection URLs. Keep `.env` out of Git.
3. Run `docker compose up -d --wait`.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Run `npm run dev` and open <http://localhost:3000>.

Development PostgreSQL uses localhost:5432 and the `taskflow` database.
Test PostgreSQL uses localhost:5433 and the `taskflow_test` database.
The development container has a named persistent volume. `docker compose stop`
stops both containers while keeping data. Do not remove the development volume
unless you intend to discard its tasks.

## Checks

- `npm test`: fast validation and task-operation tests.
- `npm run test:integration`: apply committed migrations to the separate test
  database and run real PostgreSQL integration tests. Requires Docker containers
  from the setup steps. The runner requires a test database name ending in
  `_test` and refuses the development database name. It never resets a database.
- `npm run lint`
- `npm run typecheck`
- `npm run build`: generates Prisma Client before the Next.js production build.

For schema changes, run `npx prisma migrate dev --name <change>` against the
local development database, review the generated SQL, and include the migration
in your change. Do not run migration reset against a database containing tasks.

## Architecture and behavior

See [requirements](docs/taskflow-requirements.md), [glossary](GLOSSARY.md), and
[ADRs](docs/adr/). Task operations stay inside the Next.js application;
Server Actions validate writes and Prisma accesses PostgreSQL directly.

Titles are trimmed and must contain 1 to 120 characters. Descriptions are
optional plain text with at most 1,000 characters; whitespace-only descriptions
are stored as empty. New tasks default to TODO and MEDIUM. Save waits for the
database; failures preserve the form values. Cancel returns to the task list.

Each task has an Edit task link to `/tasks/[id]/edit`. The edit page preloads
its saved title, description, status, and priority. Any transition between valid
statuses is allowed, including reopening Done tasks. Edit submissions require
explicit status and priority; creation defaults never reset an existing task.
Edits preserve the task's creation timestamp and update its modification time.
The last successful save wins when multiple tabs edit the same task.

Missing tasks show a task-specific not-found page. If a task is deleted while
its edit form is open, Save shows "Task no longer exists" and preserves entries.
Loading failures offer Retry; failed saves retain entries and show field errors
or a retryable message. Successful updates return to `/` with a success message.
Save and Cancel return to the current unfiltered, newest-first list; filter and
sort controls and preserving their view state are deferred to a later phase.

Delete task is available only on the list. A native dialog names the task and
explains that deletion is permanent. Cancel has initial focus; Confirm, Cancel,
and Escape dismissal are disabled while deleting, and progress is announced.
Deletion waits for PostgreSQL confirmation, refreshes the list in place, and
moves focus to a surviving task action or the list heading. There is no undo.
An already-absent task completes the request with an informational message.
Deletion uses the task ID even if another tab has edited it. Persistence errors
keep the dialog open and allow retry. If a response is lost, refresh or retry to
reconcile the uncertain outcome; a committed deletion is never rolled back by
a subsequent refresh failure.

Filtering, authentication, and deployment are outside this slice.
Browser behavior is checked manually; see `docs/testing/create-task.md`,
`docs/testing/edit-task.md`, and `docs/testing/delete-task.md`.

# TaskFlow

A personal task list built with Next.js App Router, TypeScript, PostgreSQL,
Prisma, Zod, Vitest, and Tailwind CSS. This slice creates tasks and displays
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

Editing, deleting, filtering, authentication, and deployment are outside this
slice. Browser behavior is checked manually; see the feature checklist in
`docs/testing/create-task.md`.

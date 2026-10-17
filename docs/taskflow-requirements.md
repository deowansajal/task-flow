# TaskFlow requirements

This document captures the requirements and design approved by the user on 2026-10-17.

## Project constraints

- Use Next.js, TypeScript, PostgreSQL, Prisma, Zod, Vitest, and Tailwind CSS in a single Next.js application.
- Keep the architecture simple and maintainable; avoid unnecessary abstractions, microservices, and premature optimization.
- Support creating, editing, deleting, filtering, and sorting tasks, with PostgreSQL persistence and a responsive interface.

## Confirmed scope and behavior

- Serve one person through one personal task list, locally or behind restricted access; no accounts, sign-in, ownership, or collaboration in the first version. See ADR 0001.
- A task has a required title, optional plain-text description, one status, and one priority.
- Due dates, subtasks, tags, and attachments are outside the first version.
- New tasks start as TODO. Any transition among TODO, IN_PROGRESS, and DONE is allowed, including reopening completed tasks.
- New tasks default to MEDIUM priority. LOW, MEDIUM, and HIGH express relative importance and do not restrict status transitions.

## Text validation

- Trim titles before validation; require 1–200 characters after trimming.
- Descriptions are optional plain text, limited to 5,000 characters. Treat whitespace-only descriptions as empty.

## Deletion

- Permanently delete a task only after a confirmation that names the task.
- Trash and undo are outside the first version.

## Filtering

- Offer separate status and priority filters, each accepting All or one value.
- Combine filters with AND: tasks must match both selected values.
- Default both filters to All, including DONE tasks.
- Text search is outside the first version.

## Sorting

- Offer Newest first (default), Oldest first, and Priority: HIGH to LOW.
- For priority sorting, order equal-priority tasks newest first.
- Retain each task's creation timestamp and use it for chronological ordering; edits do not change that timestamp.

## Creating and editing

- Use explicit Save and Cancel forms for creating and editing tasks.
- Apply edits only when Save succeeds.
- Preserve entered values if validation or saving fails and display relevant errors.
- New-task forms default to TODO status and MEDIUM priority; both can be changed before saving.

## Interface

- Use one responsive task list, with status and priority filters and sorting above it.
- Provide an Add task button and Edit/Delete actions on each task.
- Use dedicated pages for creating and editing tasks.
- Dialog-based editing and a drag-and-drop board are outside the first version.

## Navigation and view state

- Store list filters and sorting in URL query parameters so refresh and browser Back preserve the view.
- After Save or Cancel, return to the same filtered and sorted list view.
- Show a success message after saving, including when the saved task no longer matches the active filters and disappears from the list.

## Expected scale

- Target a few hundred personal tasks in the first version.
- Display all matching tasks without pagination or infinite scrolling.

## Application boundary

- Keep task reads and writes inside the single Next.js application, organized in a small task module.
- Access PostgreSQL through Prisma in server-side code.
- Validate every write with Zod on the server before it reaches the database.
- Do not add a separate public API or generic repository layer in the first version. See ADR 0002.

## Concurrent edits and missing tasks

- The last successful save wins when the same task is edited in multiple tabs; conflict detection is outside the first version.
- An older form can overwrite more recent changes.
- If a task was deleted before an edit is saved, show Task no longer exists and preserve the entered form values.

## Pending, error, and empty states

- Wait for database confirmation before showing save or delete success.
- Disable repeat submissions while an operation is pending.
- Show retryable errors for failed saves and deletes; preserve form values on failed saves.
- Show a loading error with Retry when the task list cannot be loaded.
- Distinguish No tasks yet from No tasks match your filters.

## Accessibility and responsive behavior

- Support keyboard operation and visible focus indicators.
- Label form controls and link field errors to the relevant controls.
- Use text labels for status and priority; do not rely on color alone.
- Support layouts from narrow phone screens through desktop widths.

## Testing

- Use Vitest for validation and meaningful task-operation tests.
- Run integration tests against a separate PostgreSQL test database, including persistence, filtering, and sorting behavior.
- Tests must never reset or delete data in the normal development database.
- Use a manual browser checklist for responsive behavior and accessibility.
- Automated browser testing is outside the first version.

## Development database setup

- Document Docker Compose setup for PostgreSQL with separate development and test databases.
- Configure connection URLs through environment variables; keep credentials out of Git.
- Commit Prisma migrations to Git.
- Deployment and hosting are outside the first implementation scope.

## Interview status

- No blocking requirements or design questions remain.
- The user approved these requirements and design as the basis for implementation on 2026-10-17. Implementation was not performed during the design session.
- Routine implementation details will follow these requirements and the installed Next.js documentation.



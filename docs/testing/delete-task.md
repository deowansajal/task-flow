# Delete Task verification

## Approved boundaries

- Public `deleteTask` operation: Vitest fast tests use only a Prisma database-boundary failure stub to check invalid IDs and safe error outcomes. These tests do not establish real persistence or browser behavior.
- Public task operations against PostgreSQL: integration tests verify durable deletion through `getTask` and `listTasks`, isolation, retries, and concurrency. They do not establish Server Action transport or dialog behavior.
- Manual browser verification through the Server Action: confirmation, progress, in-place refresh, focus management, accessibility, and recovery. No automated browser tests or new dependencies are added.

The operation returns `deleted` or `already_absent` on completion, and
`invalid_id` or `delete_failed` on failure. The Server Action returns only this
small result, with a separate refresh-failure indication when needed. It
revalidates the list and affected edit route after completion. Neither opening
the dialog nor cancelling it invokes deletion.

## Automated checks

Run `npm test`, `npm run test:integration`, `npm run lint`,
`npm run typecheck`, and `npm run build`.

The integration runner requires a separate database ending in `_test`, rejects
the development database name, and applies only committed migrations. Tests
track and remove only their own fixtures. No schema changes or migrations are
introduced by deletion. Never reset the development database to run these tests.

Coverage includes invalid non-string, empty, and whitespace-only IDs without
database access; safe persistence errors; Prisma P2025; durable deletion after
reconnecting; unchanged unrelated tasks; all statuses and priorities; deletion
after a newer edit; missing and repeated requests; concurrent deletion yielding
one `deleted` and one `already_absent`; and stale edits never recreating a task.
Existing Create/Edit validation and operation checks remain in place.

TDD evidence: deletion validation first failed because `deleteTask` did not
exist, then passed after validation was added. The persistence-error test next
failed with an undefined result, then passed after atomic deletion and safe
failure handling. The P2025 test failed with `delete_failed`, then passed after
adding the `already_absent` mapping. PostgreSQL coverage was added and run
incrementally through the guarded integration runner.

## Manual browser checklist

These checks require a running browser and disposable tasks. Passing Vitest,
lint, TypeScript, and build does not establish these behaviors. Rerun the
Create Task and Edit Task checklists too.

- On `/`, verify every task has Edit and Delete actions. New and Edit pages must not offer Delete.
- Open confirmation: it names the selected task, explains permanence, and initially focuses Cancel. Opening alone must not mutate data.
- Cancel or press Escape before submitting: the task remains and focus returns to its Delete button. Clicking the backdrop must not confirm deletion.
- Confirm: show Deleting task and announce progress; disable Confirm and Cancel and block Escape. Rapid clicks or repeated Enter presses must not issue duplicate requests. Use browser network throttling to observe the pending state.
- Complete deletion: remain at the same URL and scroll context, remove only the selected task after server confirmation, announce success, and focus the next task's Delete button or a previous one. Refresh the browser to confirm persistence.
- Delete the final task: retain the success announcement, show No tasks yet, and focus the task-list heading.
- In another tab, create a task after the first tab's list loads. Delete the last original task in the first tab: the refreshed list shows the new task and focus moves to its Delete button. Also verify this fallback when concurrent deletions remove all original next/previous focus candidates.
- Delete a task in a second tab after opening its dialog in the first. Confirm in the first: show Task no longer exists and refreshed list information, without claiming this request deleted it.
- Rename or otherwise edit a task in another tab after opening confirmation. Confirm deletion: delete by the selected ID without a version-conflict prompt.
- Open an edit form, delete that task from another tab's list, then Save the stale edit: retain entered values and report Task no longer exists. Reload the edit URL to see the not-found page.
- With the list loaded, stop only development PostgreSQL (`docker compose stop postgres`). Confirm deletion: retain the row and open dialog, focus and announce the safe error, and re-enable Retry and Cancel. Restart PostgreSQL (`docker compose start postgres`), retry, and confirm persistence.
- Cancel after an error, then open another task's dialog: do not retain the previous task's error. Failed deletion must not alter another task.
- Simulate a lost request/response using browser network controls. Show We couldn't confirm deletion and offer refresh or retry; do not claim that the database definitely retained the task. Reconnect and reconcile via refresh or retry.
- If deletion committed but the refreshed list cannot load, show the deletion result separately from the list-load error and its Retry control. Never describe a confirmed deletion as rolled back. If route revalidation itself fails, offer Refresh task list.
- Use keyboard only: inspect visible focus, Tab/Shift+Tab containment, least-destructive initial focus, blocked pending dismissal, error focus, and focus restoration after cancel, completion, and final-task deletion.
- With a screen reader, inspect the dialog name/description and announcements for pending, error, success, and already-absent results. The background should be inert while the modal is open.
- Check 320px, 375px, 768px, desktop widths, and browser zoom. Use long unbroken titles and plain text resembling HTML. Ensure wrapping, usable touch controls, scrollable dialog content, and no horizontal page scrolling or script execution.

## Scope and limitations

Reads and database access remain server-side. One task-specific client list
owns confirmation, pending/error/status state, and focus handling. The existing
Create/Edit forms and redirects are unchanged. Filters and sort controls remain
a later phase; accounts, public API endpoints, trash, and undo are outside scope.
The application remains intended for local or restricted access per ADR 0001.
Native dialog behavior and assistive-technology support require the manual
browser checks above.

# Issue tracker: Local Markdown

Issues and specs live in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Specs: `.scratch/<feature-slug>/spec.md`.
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, one file per ticket.
- Record triage state in a `Status:` line near the top.
  Use the roles in `triage-labels.md`.
- Append conversation under `## Comments`.

When publishing, create the appropriate spec or ticket file.
When fetching a ticket, read the referenced file.

## Wayfinding operations

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child tickets use the numbered issue paths above.
- Record `Type:` as research, prototype, grilling, or task.
- Record dependencies as `Blocked by: NN, NN`.
- The frontier is open, unblocked, unclaimed tickets,
  ordered by number.
- Claim a ticket by saving `Status: claimed` before work.
- Resolve by appending `## Answer`, setting `Status: resolved`,
  and adding a gist and link to the map's Decisions-so-far.
- A ticket is unblocked when all its dependencies are resolved.

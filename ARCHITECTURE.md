# PoolsideParent architecture

PoolsideParent remains a dependency-free, local-first progressive web app. The current goal is to preserve its poolside simplicity while giving future analysis, backup and sport variants stable foundations.

## Current boundaries

- `config.js`: swimming-specific strokes, distances, course lengths and result-source labels.
- `utils.js`: shared time, date, measurement and escaping helpers with no DOM or storage side effects.
- `storage.js`: versioned persistence, migrations, PB lookup and merge-compatible import handling.
- `performance.js`: season assignment plus historical PB/SB progression calculations used by chart overlays.
- `timer.js`: active timing state based on real timestamps rather than interval tick counts.
- `ui.js`, `layout.js`, `history-edit.js`, `result-edit.js`: presentation and user interaction.
- `progress-chart.js`: swimming performance visualisation.
- `reliability.js`, `service-worker.js`: offline cache, safe updates and backup reminders.

## Version 4 result record

Existing display fields remain supported. Migration adds canonical fields without discarding old data:

- `occurredAt`: ISO timestamp for ordering and future season calculations.
- `elapsedMilliseconds`: numeric performance time.
- `distanceMetres`: numeric event distance.
- `courseMetres`: numeric pool length.
- `source`, `createdAt`, `id`: provenance and identity.

## Direction

The reusable domain is participant + event + attempt + elapsed time + splits + standards. Swimming-specific strokes, pool lengths and terminology should remain at the presentation/configuration layer. A future athletics product can reuse the domain concepts without weakening PoolsideParent's swimming-focused interface.

The active SB season is currently a calendar year. Its start month/day live in `config.js`, allowing later jurisdiction or organisation profiles without changing stored results.

## Guardrails

- Migrate stored data forward; never silently reset it.
- Keep `main` deployable and perform structural work on review branches.
- Add a regression test when shared data or timing behaviour changes.
- Avoid accounts, central databases and framework dependencies until a demonstrated feature requires them.

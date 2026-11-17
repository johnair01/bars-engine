# Spec work ticket pilot

This branch adds app-side task revision and claim gates for tickets published from a checked Spec Kit task. The Council remains responsible for fetching the committed spec, checking its task fields and release authority, and deciding which tasks to publish. General Board-answer and recipe tickets keep their existing paths.

## Publish

`POST /api/work/spec-tasks` takes a Council-authenticated `task` packet with a stable `spec:<repo>/<feature>/Tnnn` key, a task-contract revision hash, title, bounded brief, basis, explicit configured lanes and dependency keys. It also takes `authority: {kind: "board", rowId, choice}`. The app checks that the Council row names the task prefix and choice, and that the matching answer was saved by an owner session. Local development alone also accepts `{kind: "pilot"}` for disposable tests.

Publication locks the task key, creates one immutable ticket per revision, updates the current-task pointer, and holds any ready predecessor in one transaction. A dependent ticket starts held. A second concurrent call returns the same ticket. The generic ticket path refuses `spec:` source keys and explicit unknown lanes.

## Claim, stop and return

The existing lane claim API checks the current ticket, open gate and verified dependencies in its SQL claim. Lease expiry and release hold stale or blocked tickets. Work reopened after a wait passes to the next lit allowed lane when its resting lane is dry. A worker holding a spec ticket can call `POST /api/work/spec-tasks/<ticket-id>/block` with the concrete question, checked record, missing decision, person, why, next step, options and recommendation. The task is held and a deterministic card ID is reserved before the question row is posted. A retry uses the same ID; a failed post leaves the ticket held.

The Council calls `.../resume` only after an owner-saved `resume` answer on that Board card. The Board answer does not mint a second generic ticket for this spec blocker. A worker's ordinary `done` records submitted evidence but does not open dependents. The Council calls `.../verify` with reviewer and checked evidence; only then does a dependent ticket become ready.

## Local proof

Run `scripts/local/dev.sh run -- npx tsx scripts/probe-spec-work.ts` against this checkout's isolated local database. The probe races identical publication, checks early dependency and stale claims, expires a blocked lease, rejects a menu-token answer, accepts an owner ruling, and verifies evidence before claiming the dependent task.

An HTTP pilot also published two local tickets, claimed one from a separate no-Git process, posted and retried one Board blocker with a lane token, saved a local owner answer, completed the first ticket, and claimed the dependent only after verification. The local Board store returned the blocker row, and the page showed one open item. Its morning gate prevented inspection of the card face in that browser session.

## Remaining release gates

The Council publisher and strict task metadata are tracked in the paired Council spec PR. This app branch does not turn on automatic spec publication or backfill. A worker on a different host with its own lane token, the owner answer on the deployed Board, and full card-face review remain to be proved after the paired code is available in a deployed environment. Local test IDs and answers must never be copied into production.

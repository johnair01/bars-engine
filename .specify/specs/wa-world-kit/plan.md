# Plan: the world kit and the bridge

Answers the spec in [`spec.md`](./spec.md); the ask and the trust fork in [`request.md`](./request.md) (answer **A**).
Phase order is the build order: each phase is useful alone and none needs the next.

## Phase 0 — the ground (already true, listed so nothing is assumed)

`check_assets.py` and `wa_export.py` both bite (PR #972); the dojo is an editor-owned WAM at its `/~` address; the portal
mechanism exists in miniature in `dojo.js`.

Write access to the volume is one `ssh` away at
`/var/lib/docker/volumes/workadventure_map-storage-data/_data`; the checker's target and the publish target are the same
directory, which is why Phase 1 is small.

## Phase 1 — `publish.py`, and the list it regenerates

**New**: `public/wa/publish.py`. **Changed**: nothing else.

1. `<dir>` → find the single `.tmj`/`.wam`, read `world.json` beside it.
2. Run `wa_export.check` + `check_exits` on the map, `check_assets.run_all` on the folder. Refuse on any error; print the
   file to open.
3. Snapshot: `tar czf snapshots/<ts>.tgz -C "$VOLUME" <handle>` — kept, never pruned by the tool.
4. Copy with `rsync` semantics into `_data/<handle>/<world>/`; `chown -R 1000:1000`; strip `._*` and `gen_*.py`.
5. Regenerate `portals.json` by scanning `_data/*/*/world.json` (order = `order` then title), write it beside the lobby
   map, and print the diff of what appeared/vanished.

**Verification**: publish the dojo as a dry run (should refuse: it has no `world.json` yet) → add one → dry run passes →
real publish copies nothing new (same bytes) → `portals.json` is byte-identical across two runs.

**Risk**: `rsync` in the container/host may not exist; fall back to `cp -a` + `rm -rf` of the target, since the folder is
small.

## Phase 2 — the bridge

**New**: `public/wa/bridge.js`; `src/app/api/wa/event/route.ts`, `src/app/api/wa/presence/route.ts` (+ a shared
`src/lib/wa/bridge.ts` for the registry, CORS and rate limit).

1. Registry first (a `const EVENTS = {...}` with the four starting events), because it is the contract.
2. CORS allow-list from an env var; rate limit in memory (per uuid+room, 30/min) — no Redis for phase 2.
3. Append to `wa-events.jsonl` (host path in an env var, default under `.data/`), one line per accepted event.
4. Presence: in-memory `Map<uuid, {room,x,y,at}>`, TTL sweep on read.
5. `bridge.js`: `initBridge` on `WA.onInit`, presence timer 10 s, `event()` posting `keepalive: true`, all failures
   swallowed, one flag to disable.
6. Wire one real event: `notice.read` from the Lantern Walk's notice areas (it already tracks read state per player —
   the claim duplicates nothing private).

**Verification**: `curl` both endpoints for accepted/refused/400/rate-limited; in a browser, walk the Lantern Walk, read a
notice, then `ssh` the box and `tail` the log; kill bars-engine (or point the origin at a dead port) and confirm the room
still walks and no unhandled rejection appears.

**Risk**: the map's script is public, so the *event names* are public. That is fine — the registry is an allow-list, not a
secret. The real risk is an event whose name implies a reward; the rule is that no event name carries a consequence, only
a fact.

## Phase 2.5 — identity (answer C, 2026-11-23)

Not specified here: C makes identity the unlock for per-person edit rights, character creation and the friends' half of
the kit, so it gets its own intake. What this plan records is the shape it has to fit: `OPID_CLIENT_ID`/`SECRET`/
`ISSUER` already exist in `EnvironmentVariable.ts:58-60`, `OPID_TAGS_CLAIM` (`:82`) carries tags from the provider into
`canEdit` (`LocalAdmin.ts:100`), and a tag is per-person, not per-map — per-world rights still need the admin API.

## Phase 3 — the kit (gated on Phase 2.5)

**New**: `public/wa/world-kit/` — `README.md`, `language.json`, `gen_world.py` (a generalised `gen_dojo.py`), copies of
both checkers, `world.json`, one tiny example wing.

Deliberately a copy, not a submodule: a friend clones one folder and it works offline. Copies drift, so the kit's
`README` ends with "run `publish.py --dry` on your folder" and the checkers are the drift detector.

**Verification**: on the box, from an empty directory, follow only the README and end with `check_assets.py` green and
`publish.py --dry` accepting the result. If a step needs bars-engine's source to understand, the README failed.

## Phase 4 — the lobby reads the list

One Tools item, "Portals", opening a panel page that fetches `portals.json` (a per-world menu item stops scaling at
about five). The panel is the same `openWebsite` mechanism the notice boards use, so it is not new surface.

**Verification**: publish a second world, refresh the lobby, the button appears; delete the file, the lobby still walks.

## Ordering and dependencies

- Phase 1 has no dependency on anything, and it is what makes Phase 3 safe to accept.
- Phase 2 does not need Phase 1 or 3; it needs the bars-engine routes to exist.
- Phase 3 is gated on identity (answer C), because a kit nobody but the owner can publish is a folder of instructions.
- Phase 4 needs Phase 1's file and the door intake's lobby map.

## What this plan deliberately does not do

No admin API (the door stays unbuilt), no identity provider, no Prisma model, no per-world editing rights, no polling
watchers. Each is a named later decision, not a hidden assumption.

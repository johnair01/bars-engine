# Spec: worlds on the box, a kit for friends, and a bridge into bars-engine

## Purpose

Let a friend extend **your** WorkAdventure world with tools you hand them, on **your** box, and let a room inside that
world tell bars-engine what happened in it — without anyone pretending the browser can be trusted.

**Problem**: three separate holes. A world can only be added by hand-editing the map-storage volume, with no check
between the editor and the live files. A friend cannot be given a world without also being able to redraw yours
(`canEdit` is server-wide). And nothing carries an event out of the room: a notice read, a stance finished, a garden
tended — all of it dies in the client.

**Practice**: Deftness — spec first, contract before UI, deterministic over AI. The intake that this spec answers is
[`request.md`](./request.md); the trust fork was answered **A** (claims, re-decided server-side) on board card
`wa-world-kit-1`.

## Design Decisions

| Topic | Decision |
|---|---|
| Where a world lives | A folder in the map-storage volume: `<handle>/<world>/<world>.tmj` (+ tiles). A portal is a relative path, never a link to someone else's server. |
| What may write that volume | Only `publish.py`. It validates, snapshots, then copies. The editor's own writes are the one other path and they are the owner's. |
| The list of worlds | `portals.json`, **generated** by scanning the volume. Hand-maintained lists are the thing this design refuses. |
| Trust (answer A) | The client is a sensor. Every event is a claim; bars-engine re-decides from its own state. `uuid` is a handle, not an identity. |
| Identity upgrade | When OIDC lands, the field carrying `uuid` carries a verified `sub`. No endpoint changes shape. |
| Friend's art | Comes with a `world.json` (author, licence, door) and must pass `check_assets.py` + `wa_export.py` at publish. |
| Two friends, one world | One map per wing, doors between maps. Never two people in one `.tmj`'s tile grid. |
| Secrets | None, anywhere in a world: one origin, `CORS *`, every world file is public. |
| Room state | `WA.state` stays shared-only. No private data, no garden contents, no cultivation. |

## Conceptual Model

| | |
|---|---|
| **WHO** | **owner** (draws in the client, runs publish), **friend** (builds a world locally with the kit), **visitor** (walks; a browser uuid). |
| **WHAT** | a **world** (a folder), a **wing** (one map in it), an **event** (what a visitor did), a **portal** (a name + a path to a world). |
| **WHERE** | the volume `…/map-storage-data/_data/`, served at `/map-storage/<handle>/<world>/…`; bars-engine at its own origin. |
| **Flow** | friend builds → `publish.py` validates + snapshots + copies → `portals.json` regenerated → the lobby and the dojo read it → a visitor walks → `bridge.js` posts a claim → bars-engine decides. |

## API Contracts (API-First)

### `POST /api/wa/event`

**Input**
```ts
{ uuid: string; room: string; event: string; tile?: { x: number; y: number }; meta?: Record<string, unknown>; at?: string }
```
**Output**
```ts
{ ok: true; accepted: boolean; reason?: string }
```
- `event` must be in a **registry** (`notice.read`, `stance.finished`, `plot.tended`, `bench.sat`…) — an unknown event is
  refused, not stored.
- CORS: allow-list of world origins only. Rate limit: per `uuid`+`room`, a small bucket.
- `accepted` means *stood up to the rules for this event*, never "the player is owed something". Any consequence is a
  separate server-side decision.

### `POST /api/wa/presence`

**Input** `{ uuid: string; room: string; x: number; y: number; at?: string }`
**Output** `{ ok: true; players: number }`

Presence is ephemeral (TTL ~60 s, in memory), never a historical record. It exists so a lobby can show "someone is at the
door" and so events can be checked against a recent position.

### `GET /api/wa/worlds` (phase 2)

**Output** `{ worlds: Array<{ id, title, host, path, door?: string, order?: number }> }`
Reads the generated `portals.json` and, once identity exists, filters per viewer (`canViewBar`). Phase 1 serves the file
statically instead; the shape is identical so the swap is one URL.

### `publish.py` (CLI, the only writer)

```sh
python3 public/wa/publish.py <dir> [--volume PATH] [--dry] [--no-snapshot]
```
1. `check_assets.py` + `wa_export.py` on `<dir>` — refuse on any error.
2. `world.json` present and complete (author, licence, door, title).
3. Snapshot the volume (tar, timestamped, kept).
4. Copy into `_data/<handle>/<world>/`, `chown 1000:1000`.
5. Regenerate `portals.json` from the volume and copy it beside the lobby's map.
Exit `0` published, `1` refused (nothing copied), `2` usage.

### `world.json`

```json
{ "title": "The Library", "author": "Ana", "licence": "CC-BY-4.0",
  "door": { "from": "calrunian-dojo", "role": "to-library" },
  "entry": "library.tmj", "order": 20 }
```

### `portals.json` (generated)

```json
{ "generatedAt": "2026-11-23T18:40:00Z",
  "worlds": [{ "id": "ana/library", "title": "The Library", "host": "Ana", "path": "../ana/library/library.tmj", "door": "to-library", "order": 20 }] }
```

### `bridge.js` (in the map's own folder, imported by the map script)

```js
import { bridge } from "./bridge.js";
const wa = await bridge({ origin: "https://bars-engine.vercel.app", room: "calrunian-dojo" });
await wa.event("notice.read", { step: 2 });   // posts a claim; ignores offline failures
```
Contract: never throws into the map script, never blocks a frame, batches presence to one request per 10 s, and is
disabled wholesale by one flag (`data-bridge="off"`).

## User Stories

### P1: a world can be added without touching the volume by hand

**As the owner**, I want to publish a folder and have it validated, snapshotted and served, so that a mistake by a friend
cannot reach the live world.

**Acceptance**: `publish.py` on a folder that fails either checker copies nothing and exits 1, naming the file; on a good
folder it copies, snapshots first, and `portals.json` lists the new world.

### P2: the list of worlds cannot go stale

**As a visitor in the lobby**, I see every published world and no dead ones.

**Acceptance**: `portals.json` is regenerated on every publish; a world removed from the volume disappears from the list;
the file's `worlds[].path` resolves to a served map.

### P3: a room can tell bars-engine what happened

**As bars-engine**, I want claims from the world that name a browser uuid, a room and an event, so that visits and
actions can be recorded without an identity provider.

**Acceptance**: `POST /api/wa/event` with a registered event returns `accepted: true` and writes one line to the event log;
an unregistered event is refused; a malformed body is 400; a flood from one uuid is rate-limited; CORS refuses an origin
that is not a world.

### P4: a friend can make a world that fits

**As a friend**, I clone one folder, read one page, run one generator, and the checkers tell me what is wrong before I
send it.

**Acceptance**: `world-kit/` contains the contract, `check_assets.py`, `wa_export.py`, a generator, and a `README` whose
steps produce a passing world from an empty folder without reading bars-engine's source.

### P5: the bridge can never break a room

**As a visitor**, a bars-engine outage costs me nothing.

**Acceptance**: with the endpoint unreachable, the room loads and walks; `wa.event()` resolves `{ ok: false }`; no
unhandled rejection reaches the console; a config flag disables the bridge entirely.

## Functional Requirements

### Phase 1 — publish and the list

- **FR1**: `publish.py` runs both checkers and refuses to copy on any error, printing the offending file.
- **FR2**: it snapshots the volume before writing, and never deletes a snapshot.
- **FR3**: it validates and rewrites `portals.json` from the volume; the generator is idempotent (same input → same bytes).
- **FR4**: `world.json` is required; missing fields are a refusal, not a warning.

### Phase 2 — the bridge

- **FR5**: `bridge.js` with the contract above, and one flag to disable it.
- **FR6**: `/api/wa/event` with the registry, rate limit, CORS allow-list, and an append-only log.
- **FR7**: `/api/wa/presence` with a 60 s TTL; no history.
- **FR8**: the log is written server-side only and is never served to the world.

### Phase 3 — the kit

- **FR9**: `world-kit/` is a copyable folder: language file, generator, both checkers, `world.json` template, `README.md`.
- **FR10**: the README's steps are verified by running them from an empty directory on the box.

### Phase 4 — the lobby reads the list

- **FR11**: the lobby map's script fetches `portals.json` and registers a portal per world (menu or panel, one decision
  recorded in `plan.md`); a missing or malformed file leaves the room walkable.

## Non-Functional Requirements

- **No secrets in any world file** (one origin, `CORS *`).
- **Determinism**: `publish.py` and `portals.json` are byte-stable for unchanged input; the checkers are the gate.
- **Offline tolerance**: the bridge degrades to silence, never to an exception.
- **Rate limits** on both endpoints; presence capped in memory.
- **Reversibility**: a snapshot before every publish; the volume's history is the tarballs.
- **Privacy**: an event log line holds a uuid, a room, an event, a tile and a timestamp — nothing about a person, and
  never anything from `WA.state`.

## Persisted data

Phase 1 persists files only. Phase 2 appends to `wa-events.jsonl` on the bars-engine host (one JSON object per line,
`{at, uuid, room, event, tile, meta}`) — a log, not a schema, so the shape can be settled by reading real events before
anything is promoted to Prisma. A Prisma model is deliberately **not** proposed here: the event vocabulary is the thing
that should come from the log first.

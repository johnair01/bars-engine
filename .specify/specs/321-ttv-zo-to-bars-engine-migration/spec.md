---
type: spec
spec_kit_id: 321-ttv-zo-to-bars-engine
title: "321 + TTV — Zo.space to Bars-engine (Two Slices)"
created: 2026-05-25
last_reviewed: 2026-06-24
status: Phase 1 — Slice 1 READY, Slice 2 REDESIGN (open questions resolved)
tags:
  - migration
  - zo-space
  - 321-shadow
  - tap-the-vein
  - bars-engine
  - vercel
  - lenses
owner: wendellbritt
problem: |
  321 needs a permanent home on bars-engine. TTV needs a bars-engine-native daily
  ritual surface that integrates with lenses (intentions), campaign assignment,
  and quest upgrade — NOT a one-shot capture mirror. zo.space TTV stays online for
  non-bars-engine users; this spec does NOT decommission zo.space TTV.

---

## Scope Split — Two Slices

| Slice | Surface | Status | What it covers |
|-------|---------|--------|----------------|
| **Slice 1 — 321** | `/shadow/321` + `/api/321/save` | READY for build | Migrate Shadow321Session capture flow from zo.space to bars-engine |
| **Slice 2 — TTV (daily ritual)** | `/tap-the-vein` + `/api/tap-the-vein/*` | REDESIGN in this revision | New daily ritual: lenses pull → brainstorm → commit (≤5 tasks/day) → assign / upgrade / carry / compost |

**Decommission zo.space 321:** YES (Slice 1 success criterion).
**Decommission zo.space TTV:** NO — kept for non-bars-engine users. Slice 2 adds a parallel bars-engine-native TTV; the two coexist.

## Lenses Cross-link (Diplomat concern resolved)

Lenses is the upstream seed for TTV brainstorming. Per `docs/plans/internal-lenses-spec.md`:

- Morning flow sequence: **active lenses intake → TTV → 321**
- TTV brainstorm pulls from today's `LensState.intentions.daily` per category (Health / Relationships / Career / Money) as seed prompts
- Each committed TTV task stores `lensLevel` (yearly|quarterly|monthly|weekly|daily) + `lensCategory` so carry-over and review can trace commitments back up the cascade
- Face-scope map (Phase 3 of lenses spec) governs which face owns the brainstorm prompt at each level; TTV inherits this — the brainstorm UI shows the owning face's hexagram/move language per level

## TTV Privacy — Campaign Assignment Model (Diplomat concern resolved)

Tasks committed in TTV are **private by default**. Connecting to a campaign does NOT auto-share:

| Visibility | Who sees | When set |
|------------|----------|----------|
| `private` | Player only | Default on commit |
| `shared_with_campaign` | Player + campaign stewards + members | Player toggles in TTV review or during assign action |

Inner-work quests (e.g., shadow work FOR a campaign but not its business) stay `private`. Stewards never see a task the player hasn't explicitly shared. `assigned_to_campaign_id` is a separate field from `visibility` — assignment says "this counts against the campaign's progress" without making the content public.

---

## Context

**What we're building:**

| Flow | Source of truth (Slice 1) | Source of truth (Slice 2) |
|------|---------------------------|---------------------------|
| 321 shadow work | `Shadow321Session` Prisma model (exists) | n/a |
| Tap the Vein | n/a | New `TapTheVeinDailySession` + `TapTheVeinTask` models |

**Why Slice 2 redesigns (not mirrors) the zo.space TTV:**

The zo.space TTV is a one-shot capture page (rawText → EA channel → barPhrases → save). That model doesn't survive contact with how TTV actually gets used:

- It's a **daily ritual**, not episodic. Morning-pages cadence.
- It's **stateful across days**. Unfinished work carries over until the player consciously composts it.
- It has **two-way integration** with the rest of bars-engine: tasks get assigned to campaigns or upgraded to quests.
- It's **seeded by lenses**, not by a blank page.

The current spec's `TapTheVeinEntry` model captures a single entry. That's the wrong grain. We need a **daily session container** with **per-task lifecycle tracking**.

**What exists already:**
- `Shadow321Session` Prisma model — partial schema, maps to 321 session fields
- `/api/321/ingest/route.ts` — reads sandbox filesystem, converts 321 to `CustomBar` via `map321ToBarDraft`
- bars-engine uses `createCustomBar` action for bar creation
- No TTV model in Prisma schema
- `LensState` design in `docs/plans/internal-lenses-spec.md` v0.2 (P1a not yet implemented)

---

## Migration Phases

### Phase 1 — Infrastructure design (THIS SPEC)

**Done (Slice 1):**
- [x] Audit bars-engine Prisma schema
- [x] Audit existing 321 ingest route
- [x] Map zo.space data structures to target Prisma types
- [x] Confirm frontend deployment-agnosticism
- [x] Confirm `Shadow321Session.phase3Snapshot` covers 321 fields (belief, secondPersonDialogue, synthesis, eqScore, aqScore, tags)

**Done (Slice 2):**
- [x] Confirm TTV is a daily ritual, not one-shot capture
- [x] Confirm lenses is the brainstorm seed (per `internal-lenses-spec.md`)
- [x] Confirm tasks have private-by-default visibility independent of campaign assignment
- [x] Confirm carryover + compost lifecycle
- [x] Confirm assign-to-campaign and upgrade-to-quest exit paths
- [x] Confirm zo.space TTV stays online (not decommissioned by this spec)

**Slice 1 — READY for build.**
**Slice 2 — READY for build (model + API contracts). Frontend is Phase 4 work.**

---

### Phase 2 — Prisma schema extension (Slice 1 + Slice 2)

#### 2a — Shadow321Session: no schema change needed (Slice 1)

`phase3Snapshot` captures the full 321 JSON. Migration reads sub-fields from snapshot; bars-engine API reads from Prisma.

#### 2b — TapTheVeinDailySession + TapTheVeinTask (Slice 2)

**Daily session container** — one per player per day. Created on first brainstorm open.

```prisma
model TapTheVeinDailySession {
  id              String   @id @default(cuid())
  playerId        String
  sessionDate     DateTime @db.Date              // one per player per day (unique constraint)
  lensesPulled    Json                            // [{ level, category, intentionId, faceKey }] from LensState
  brainstormNotes String?                         // freeform notes from brainstorm phase
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?                       // set when player marks day's work complete
  tasks           TapTheVeinTask[]

  @@unique([playerId, sessionDate])
  @@index([playerId, sessionDate])
}
```

**Per-task lifecycle** — committed tasks with explicit state machine:

```prisma
model TapTheVeinTask {
  id                   String   @id @default(cuid())
  dailySessionId       String
  playerId             String                       // denormalized for index/perf
  text                 String
  lensLevel            String?                      // yearly|quarterly|monthly|weekly|daily
  lensCategory         String?                      // health|relationships|career|money|custom
  lensIntentionId      String?                      // FK to originating LensState intention (v1.1 — requires lenses P1a to mint Intention.id)
  lensIntentionTextSnapshot String?              // Snapshot of intention text at commit time; survives lens rewrites
  faceKey              String?                      // inherited from lenses face-scope map

  // Lifecycle state machine
  status               String   @default("committed")
  // committed → in_progress → (completed | carried_over | composted | assigned_to_campaign | upgraded_to_quest)

  // Assignment + visibility
  campaignId           String?                      // when status = assigned_to_campaign
  visibility           String   @default("private")
  // private | shared_with_campaign | shared_with_quest

  // Upgrade path
  upgradedToQuestId    String?                      // when status = upgraded_to_quest

  // Compost metadata
  compostedAt          DateTime?
  compostReason        String?                      // not_relevant | already_done | assigned_elsewhere | too_small | too_big | other

  // Carryover tracking
  carriedFromDate      DateTime?                    // sessionDate of original daily session
  carryCount           Int      @default(0)         // how many days this task has carried over

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  completedAt          DateTime?

  dailySession         TapTheVeinDailySession @relation(fields: [dailySessionId], references: [id])

  @@index([playerId, status])
  @@index([playerId, carryCount])
  @@index([campaignId, visibility])
}
```

**Lifecycle transitions:**

```
                            ┌──→ completed
committed → in_progress ────┤
                            ├──→ carried_over (re-commit to next session)
                            ├──→ composted (with reason)
                            ├──→ assigned_to_campaign (status changes; visibility optional)
                            └──→ upgraded_to_quest (status changes; creates Quest record)
```

A task stays in `committed` until the player marks it `in_progress` (start of work) or transitions it to an exit state. There is no auto-transition based on time — **the player is the authority on completion**, including for carryover (a task carries over explicitly via "push to tomorrow" action, never implicitly).

**Source of truth:** `TapTheVeinTask` is the canonical record for TTV-sourced tasks. When a task is promoted to a `Bar`, the `Bar` is a *derived projection* (reference + display copy) — `TapTheVeinTask` remains authoritative for lifecycle, carryover, and compost history. Deleting the Bar does not delete the task; deleting the task archives the Bar reference.

#### 2c — Player-scoped access (both slices)

Both models require `playerId` on every record. API routes must:
1. Validate session via `getCurrentPlayer()` from `bars-engine/src/lib/auth.ts` (cookie-based, `bars_player_id`)
2. Enforce `WHERE playerId = <sessionPlayerId>` on every read/write
3. Return 401 if no valid session; 403 if cross-player access attempted

**No Prisma changes for auth model** — use existing `Player` model + cookie session.

#### 2d — Player count assumption (Diplomat concern resolved)

Single operator + invited players. Wendell is admin of both zo.space and bars-engine. TTV data is per-player-scoped; no multi-tenant / steward-visibility concerns apply beyond what the visibility field governs.

---

### Phase 3 — bars-engine API routes

#### Slice 1 — 321 routes (existing pattern)

**3a — `/api/shadow-321/save`** (new route, replaces zo.space `/api/321/save`)
- Auth: `requirePlayer()`
- Body: 321 session JSON
- Action: upsert `Shadow321Session` by `(playerId, sessionDate)`
- Returns: `{ id, savedAt }`

**3b — Migration: 321 JSON vault → Prisma** (run once after Phase 2 schema migration)
- Snapshot `/home/workspace/The Library/03 BARs/321/` first
- For each `{id}.json`: parse, write to `Shadow321Session`
- Idempotent on `(playerId, sessionDate)` collision

#### Slice 2 — TTV routes (new pattern)

**3c — `/api/tap-the-vein/daily-session` (POST)**
- Auth: `requirePlayer()`
- Body: `{ sessionDate: YYYY-MM-DD, lensesPulled: [...], brainstormNotes?: string }`
- Action: upsert `TapTheVeinDailySession` by `(playerId, sessionDate)`. If exists, returns current session.
- Returns: `{ id, sessionDate, lensesPulled, tasks: [...] }`

**3d — `/api/tap-the-vein/task` (POST)**
- Auth: `requirePlayer()`
- Body: `{ dailySessionId, text, lensLevel?, lensCategory?, lensIntentionId?, faceKey? }`
- Validation: `dailySessionId.playerId === sessionPlayerId`; status defaults to `committed`
- Action: create `TapTheVeinTask`, return full record
- Returns: `{ task: TapTheVeinTask }`

**3e — `/api/tap-the-vein/task/:id` (PATCH)**
- Auth: `requirePlayer()`
- Body: any subset of `{ text, status, campaignId, visibility, completedAt }`
- Validation: ownership check; status transition validation against the lifecycle state machine
- Action: update `TapTheVeinTask`; if `status = completed`, set `completedAt`; if `status = composted`, require `compostReason`
- Returns: `{ task: TapTheVeinTask }`

**3f — `/api/tap-the-vein/task/:id/carry` (POST)**
- Auth: `requirePlayer()`
- Action: clone task into the next day's `TapTheVeinDailySession`, set original `status = carried_over`, increment `carryCount`, set `carriedFromDate`. No-op if no tomorrow session exists yet — auto-creates with empty lensesPulled.
- Returns: `{ carriedTask: TapTheVeinTask, newSessionId: string }`

**3g — `/api/tap-the-vein/task/:id/upgrade-to-quest` (POST)**
- Auth: `requirePlayer()`
- Action: create `Quest` record from task text (call existing bars-engine quest creation action), set `task.status = upgraded_to_quest`, `task.upgradedToQuestId = quest.id`
- Returns: `{ task: TapTheVeinTask, quest: { id, title } }`

**3h — `/api/tap-the-vein/today` (GET)**
- Auth: `requirePlayer()`
- Action: get-or-create today's `TapTheVeinDailySession` for player, return session + tasks (with carried-over from yesterday surfaced at top)
- Returns: `{ session, tasks, carriedFromYesterday: [...] }`

**3i — `/api/lenses/today` (GET)** — bridges lenses → TTV brainstorm
- Auth: `requirePlayer()`
- Action: compute which `LensState` levels are active today (calendar-aware per lenses spec), return `{ activeLevels: [{ level, categories: [{ category, intention, faceKey }] }] }`
- TTV brainstorm UI calls this on open to seed prompts
- **Gate:** this route is part of lenses implementation; if lenses P1a not yet shipped, TTV uses a stub that returns empty array and the brainstorm UI shows blank prompts. Defer full integration to when lenses ships.

**3j — Slice 2 migration: existing TTV JSON → Prisma (optional, advisory)**

The old TTV JSON files are one-shot captures. They do not map cleanly to the new daily-session model. Two options:
- **A (recommended):** Archive old TTV JSON to `/home/workspace/The Library/03 BARs/tap-the-vein-archive/` and start fresh in bars-engine. Old captures remain readable as raw JSON but do not appear in the new TTV UI.
- **B (defer):** Build a `LegacyTapEntry` import view in bars-engine for read-only historical access. Defer to v1.1 unless explicitly requested.

Default to **A** unless Wendell specifies otherwise.

---

### Phase 4 — Frontend cutover

#### Slice 1 (321)

The `/shadow/321` page already uses `window.location.origin` for API calls. Update the route from `https://wendellbritt.zo.space/api/321/save` to `https://bars-engine.vercel.app/api/shadow-321/save` (or rely on self-detection if migrated to bars-engine routes).

#### Slice 2 (TTV)

The new `/tap-the-vein` route on bars-engine is **not a port** of the zo.space page — it's a new UI for the daily ritual. Spec includes:

1. **Morning open** — `GET /api/tap-the-vein/today` + `GET /api/lenses/today`. Surfaces carried-over tasks from yesterday, then today's active lens intentions as brainstorm seeds.
2. **Brainstorm phase** — freeform notes area. Seeded by lens prompts (one per active level per category, with owning face's hexagram language).
3. **Commit phase** — extract up to 5 tasks from brainstorm. Each task can be tagged with `lensLevel`, `lensCategory`, `faceKey` (defaults inferred from brainstorm position).
4. **Work phase (during day)** — list view of today's committed tasks. Actions: start (`in_progress`), complete, carry to tomorrow, compost (with reason), assign to campaign (toggle visibility), upgrade to quest.
5. **Evening close** — `POST /api/tap-the-vein/daily-session` with `completedAt`. Tasks not transitioned to an exit state prompt for explicit carry/compost decision — no silent carryover.

**Visibility UI:** When assigning to a campaign, show a checkbox: "Share with campaign stewards and members" (default OFF). Inner-work tasks stay private.

**zo.space TTV** stays online for non-bars-engine users. No cutover.

---

### Phase 5 — Decommission (Slice 1 only)

- Stop writing to zo.space `/api/321/save`
- Archive zo.space `/shadow/321` route to `/shadow/321-archive`
- **Do NOT touch zo.space `/tap-the-vein`** — non-bars-engine users continue to use it
- Downgrade Zo Computer plan if 321 was the last route requiring it

---

## Resolved Open Questions

1. **Shadow321Session field coverage** — ✅ `phase3Snapshot` covers all fields. No schema change.
2. **TTV analysis pipeline (EA channel, chargeStrength)** — ❌ DROPPED from Slice 2. The new TTV does not run EA-channel analysis on raw text; that's a 321-domain analysis. TTV tasks are committed text + lens metadata only.
3. **Data volume** — N/A for Slice 2 (fresh start, no historical migration by default).
4. **Authentication** — ✅ Use existing `getCurrentPlayer()` cookie session. No middleware change.
5. **Non-bars-engine users** — ✅ zo.space TTV stays online. Slice 2 adds a parallel surface, not a replacement.
6. **Campaign visibility** — ✅ `visibility` field on `TapTheVeinTask` is independent from `campaignId`. Inner-work stays private.
7. **Lenses integration** — ✅ TTV brainstorm pulls from `LensState` via `/api/lenses/today` (or stub if lenses P1a not shipped).
8. **Face-scope in TTV** — ✅ `faceKey` on task, inherited from lenses face-scope map. UI shows face language for brainstorm prompts and committed tasks.

---

## Dependencies

- **TTV Slice 2 v1.1** depends on **lenses P1a** minting `Intention.id` in `LensState` so `lensIntentionId` foreign keys can resolve. See `docs/plans/internal-lenses-spec.md`.
- For TTV **v1 (current scope)**, all `lens*` and `lensIntentionId` fields on `TapTheVeinTask` are nullable. TTV can ship without lenses P1a; brainstorm seed pulls return empty array until lenses is live.
- **TTV + 321 order:** morning flow sequence per lenses spec is `active lenses intake → TTV → 321`. TTV schema is independent of 321 schema (different Prisma models), but UX integration assumes lenses is upstream.

---

## Out of Scope (Future Phases)

- v1.1: Bulk-import legacy TTV JSON (Slice 2 migration option B)
- v1.1: TTV analytics — completion rate by `lensCategory`, average `carryCount` before completion vs compost, etc.
- v2: Multi-player shared daily sessions (study group mode)
- v2: Lenses face-scope auto-suggestion (currently player-configurable; TTV could suggest based on carryover patterns)

---

## References

- `Shadow321Session` Prisma model (see `bars-engine/prisma/schema.prisma`)
- Player auth: `bars-engine/src/lib/auth.ts` (`getCurrentPlayer`, `requirePlayer`)
- Lenses spec (Slice 2 seed): `docs/plans/internal-lenses-spec.md`
- Lenses plan: `docs/plans/internal-lenses-plan.md`
- Lenses gap analysis (TTV/321/lenses interaction): `docs/plans/2026-04-30-ttv-321-lenses-gap-analysis.md`
- zo.space 321 save: `wendellbritt.zo.space/api/321/save` (decommissioned after Slice 1)
- zo.space TTV: `wendellbritt.zo.space/tap-the-vein` (kept online — non-bars-engine users)
- `map321ToBarDraft`: `bars-engine/src/lib/quest-grammar/map321ToBarDraft.ts`
- Phase 3 ingest route: `bars-engine/src/app/api/321/ingest/route.ts`
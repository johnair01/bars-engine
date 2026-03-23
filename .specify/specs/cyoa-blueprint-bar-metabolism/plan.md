# Plan: CYOA blueprint → BAR metabolism

Implement per [.specify/specs/cyoa-blueprint-bar-metabolism/spec.md](./spec.md).

## Phase 1 — Contracts & auth threading

1. Define **`AuthContext`** and thread it through **adventure / CYOA render path** (server components or loaders that build passage + choices).
2. Map **compile-time defaults** (e.g. `Create my account` in [compileQuestCore.ts](../../../packages/bars-core/src/quest-grammar/compileQuestCore.ts) and GM packets) to **conditional emission** when `isAuthenticated` is true—**suppress** signup targets or swap to “Continue” / campaign-appropriate CTA.
3. Unit tests: authenticated vs anonymous choice lists for the same node fixture.

## Phase 2 — Cardinality & copy channels

1. Extend passage/choice model with **`choiceCount`** (or derive from `choices.length` at render) and **body variant key** / **structured slots**.
2. Stop generating **static “five face” paragraphs** where a single template is reused; use **variant A (n=1)** vs **variant B (n>1)** or slot fill.
3. Add **`buttonLabel` / `voiceLine`** separate from `blueprintKey` in compiled output or authoring schema.

## Phase 3 — Blueprint → prompt library → BAR emission

1. Introduce **`blueprintKey`** registry (JSON or DB table) → **prompt library** entries (deterministic ids).
2. On **choice committed** server action: resolve prompts → **create BAR draft(s)** → append **`artifactLedger`** on run state (Prisma JSON on `PlayerQuest` / dedicated table / existing micro-twine state—decide in tasks).
3. Idempotent or deduped emission rules documented (same node re-entry).

## Phase 4 — UI: modal + Transcendence

1. **Bottom modal** component: reads **ledger** for current run; does not navigate; accessible.
2. **Transcendence passage** (or node): renders **full BAR list** from ledger in journey order.

## Phase 5 — Hexagram state

1. On cast / select: persist **`HexagramBinding`** into **`cyoaState`**.
2. Pass state into **render** and/or **prompt library** filters (e.g. trigram/hexagram tags).
3. Optional: emit **milestone tag** on cast for [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md).

## File impact (expected)

| Area | Files / dirs |
|------|----------------|
| Quest grammar / compile | `packages/bars-core/src/quest-grammar/`, `src/lib/quest-grammar/` |
| Adventure player / Twine bridge | `src/app/adventure/`, `src/lib/micro-twine-persist.ts`, Twee under `content/twine/` |
| BAR creation | `src/actions/create-bar.ts` or dedicated `emitBarFromCyoa.ts` |
| Schema | `prisma/schema.prisma` if new run ledger table (coordinate `npm run db:sync` + migration) |
| UI | New modal + passage components |

## Order of execution

Phase 1 → 2 → 3 → 4 → 5 (hexagram can partially parallel Phase 2 if state shape is fixed early).

# Spec: Bruised Banana House Instance (Y)

**Backlog:** [BACKLOG.md](../../backlog/BACKLOG.md) row **Y** (priority 21)  
**Relates to:** [bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md) (domain model, blockers, Phase 5), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (throughput UX; does not replace house coordination)

---

## Purpose

Create a **dedicated game instance** for **physical house coordination** (Wendell, Eddy, JJ + community) alongside the **residency / fundraiser** instance (`campaignRef: bruised-banana`). House work maps to **SKILLFUL_ORGANIZING** and **DIRECT_ACTION** in the allyship frame; the fundraiser remains **GATHERING_RESOURCES**.

This spec delivers **legible presence in the data model + idempotent seed** first; **recurring quests** and **structured house state** are phased (see `plan.md`).

---

## Problem

- House coordination has no **named instance** in-engine → no memberships, board ref, or future recurring quests scoped to “the house.”
- Residency BB instance is **not** the same object as “house health” (ANALYSIS Part 1–3).

---

## Functional requirements

### FR1 — House instance record

- Stable **`slug`**: `bruised-banana-house`.
- Stable **`campaignRef`**: `bruised-banana-house` (for future `?ref=` routes, gameboard, hub without colliding with `bruised-banana`).
- **`parentInstanceId`** or **`linkedInstanceId`** to the primary Bruised Banana residency instance when that row exists (seed sets **parent** = BB residency so admin tree groups house under residency).
- **`primaryCampaignDomain` / `allyshipDomain`**: `SKILLFUL_ORGANIZING` (house health / systems).
- **`domainType`**: `house` (free-form label for UI/admin).
- **`isEventMode`**: `false` unless product later turns on donations for house.

### FR2 — Idempotent seed

- Script: `scripts/seed-bruised-banana-house-instance.ts`, npm **`seed:bb-house`**.
- Resolves BB residency by `campaignRef: bruised-banana` or slugs `bruised-banana` / `bb-bday-001` (first match).
- If no BB instance: **warn**, still upsert house instance with null parent/link.

### FR3 — Optional memberships (operators)

- Env **`BB_HOUSE_MEMBER_EMAILS`**: comma-separated emails → `InstanceMembership` for matching `Player` rows (idempotent upsert by `(instanceId, playerId)`).

### FR4 — v1 house state placeholder (no new schema)

- Optional **`goalData`** JSON string on Instance: version + minimal `house` object for future UI (recurring quest completion can update later).

### FR5 — Documentation

- This spec kit + runbook line in `plan.md` for operators (set active instance is **not** required for house unless you want `/event` to show house — usually keep fundraiser active).

### FR6 — Recurring quest stubs (Phase 2)

- Data: `data/bruised_banana_house_recurring_quests.json`.
- Seed: `npm run seed:bb-house-quests` — upserts `CustomBar` rows with fixed ids, `campaignRef: bruised-banana-house`, `docQuestMetadata.houseRecurring` `{ cadence, instanceSlug, campaignRef }`.
- **Not** automated recurrence (no cron); operators use cadence as ritual guidance.

### FR7 — House state read/write (Phase 2)

- `Instance.goalData` JSON: `schema: bruised-banana-house-state-v1`, `house: { operatorNote?, healthSignal?, updatedAt?, recurringLastDone? }`.
- Helpers: `src/lib/bruised-banana-house-state.ts` (`parseHouseGoalData`, `mergeBruisedBananaHouseGoalData`, `isBruisedBananaHouseInstance`).
- Admin: **Edit instance** shows house panel when slug or `campaignRef` is `bruised-banana-house` (`InstanceEditModal`).

---

## Out of scope (later phases)

- Automated recurrence / cron, completion-driven `recurringLastDone` updates.
- Player-facing house dashboard, appreciation-to-house, service donation — see ANALYSIS Phase 3–5.

---

## Acceptance criteria

1. `npm run seed:bb-house` (with DB) upserts instance `bruised-banana-house` with `campaignRef: bruised-banana-house` and correct domain fields.
2. When BB residency exists, house instance **`parentInstanceId`** points at it.
3. Optional env adds memberships without duplicates.
4. `plan.md` + `tasks.md` exist; BACKLOG **Y** references this spec path.
5. **Phase 2:** `npm run seed:bb-house-quests` creates three house quests; admin can edit operator note + health on the house instance; `goalData` merges without dropping unknown keys.

---

## References

- `prisma/schema.prisma` — `Instance`, `InstanceMembership`
- `scripts/seed-allyship-instances.ts` — upsert patterns
- `scripts/seed_bruised_banana_quest_map.ts` — BB instance resolution

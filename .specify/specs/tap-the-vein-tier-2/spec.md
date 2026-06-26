# Spec: Tap the Vein — Tier 2 (economy, inline 3·2·1, idea storm/vault, upgrade ceremony)

> **Reshaped by [lens-integration-refactor](../lens-integration-refactor/spec.md).**
> Daily TTV will attach to today's **Lens**; **TTVE**'s mint must populate Vibeulon
> attribution (lens/channel/growthSource); **TTVS/TTV3** run inside the lens flow.
> Re-scope these phases after Lens P2/P4 land.

## Purpose

Tier 1 shipped the working Tap the Vein daily ritual + NOW panel (the morning
free-write → commit ≤5 tasks → lifecycle → seal, on the `TapTheVeinDailySession`
/ `TapTheVeinTask` models). The Claude Design handoff introduced **four net-new
subsystems** that Tier 1 deliberately deferred because each needs new data and
economy wiring. This spec scopes those four as phases so they can be built
incrementally without re-deriving the design.

**Problem**: the Tier 1 UI shows ♦ chrome read-only and omits the 3·2·1, idea
storm, and upgrade ceremony. The design promises these; the backend doesn't
exist yet.

**Practice**: Deftness Development — spec kit first, API-first (contract before
UI), deterministic over AI. Each phase ships behind its own verification quest.

**Design source**: `docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md` +
the Claude Design handoff (screens 06/09/12, 16–25). Tier 1 build: PR #144.

## Conceptual Model (WHO / WHAT / WHERE / Energy / Throughput)

| Dimension | Mapping |
|-----------|---------|
| WHO | Player (nation element drives card color), campaign stewards (on share) |
| WHAT | TTV tasks (BAR seeds) → optionally Quests / Daemons |
| WHERE | Morning ritual surface (`/tap-the-vein`); upstream of campaigns |
| **Energy** | **Vibeulons (♦)** — minted on completion / charge-drop; spent on upgrades and overflow Vault deposits |
| Throughput | Wake Up (notice) → Clean Up (3·2·1) → Show Up (complete tasks) |

## Phases (each is a backlog entry)

### Phase A — TTVE · Vibeulon economy for TTV  *(foundational — build first)*
Mint and spend ♦ through the **existing** wallet/ledger (`db.vibulon`,
`src/actions/economy.ts`), not a parallel currency.
- Complete a task → **♦ +1** ("a brick is paved"), minted **once** per task
  (idempotent — see Prisma below).
- Reserve display on the Work screen + Seal "♦ Minted" tile become real.
- Provides the spend/mint primitives the other three phases call.

### Phase B — TTV321 · inline 3·2·1 thread + charge bonus
The optional Clean Up step between Brainstorm and Commit (handoff 16–20).
- Autosaved chat thread: phase 3 (Face it, single voice) → phase 2 (Talk to it,
  **two voices**, voice switcher) → phase 1 (Be it, single voice).
- **Charge sliders** bookend it (before/after, 0–10). If `before − after > 2`,
  mint **♦ +1 bonus** (via TTVE) on top of the base completion.
- Reuse the existing `Shadow321Session` as the store where possible; link it to
  the day.

### Phase C — TTVS · Idea Storm → Distill → Hand/Vault
Generate-then-triage (handoff 21–25).
- **Timed dump** of raw ideas (pre-card rows) → **Distill** to a hand of ≤5
  (today's play) → **Merge** two ideas into one → **Send to Vault**.
- Vault economy: **first 5 deposits/day free, then ♦1 each** (via TTVE).
- Distilled "today's play" feed into the Commit phase as seed tasks; integrates
  with the existing **Hand** (`HandSlot`).

### Phase D — TTVU · Upgrade ceremony (Quest or Daemon)
The "lift it out of your hand" ceremony (handoff 12).
- Ceremony UI (double glow / scale-up / 432 Hz) — already specced as the Ritual
  interaction state.
- Actually create a **Quest** (existing quest-creation action) or **Daemon**
  (existing daemon system) from the task; **spend ♦** (Quest 3 / Daemon 2 — confirm
  against live economy) via TTVE.
- Set `task.questId` (exists) / new `task.daemonId`; status `upgraded_to_quest`
  (exists) + a `upgraded_to_daemon` status.

## API Contracts (API-First)

Define before UI. Extends `src/actions/tap-the-vein.ts`.

### Phase A
- `completeTask(taskId)` → `{ task, minted: number }` — sets `completed`,
  mints ♦ once (idempotent via `rewardMintedAt`), writes a ledger row.
  (Replaces the generic `updateTaskStatus(..,'completed')` path for completion.)

### Phase B
- `start321(dailySessionId, chargeBefore)` → `{ threadId }`
- `append321Message(threadId, { phase, voice, text })` → `{ message }`
- `finish321(threadId, chargeAfter)` → `{ chargeBonus: boolean, minted: number }`

### Phase C
- `startStorm(dailySessionId, durationSec)` → `{ stormId, endsAt }`
- `addIdea(stormId, text)` → `{ idea }`
- `distill(stormId, keepIdeaIds[])` → `{ tasks }` (≤5 become today's play)
- `mergeIdeas(stormId, ideaIds[], mergedText)` → `{ idea }`
- `sendToVault(ideaId)` → `{ deposited, freeRemaining, charged: number }`

### Phase D
- `upgradeTask(taskId, target: 'quest' | 'daemon')` → `{ task, questId?, daemonId?, spent: number }`

**Route vs Action**: all Server Actions (form/React surfaces; no external consumers).

## Persisted data & Prisma

Read `.agents/skills/prisma-migration-discipline/SKILL.md`. Each phase commits a
migration with the schema change.

- **Phase A**: `TapTheVeinTask.rewardMintedAt DateTime?` (idempotent mint guard).
- **Phase B**: `TapTheVeinDailySession.clean321SessionId String?` (+ reuse
  `Shadow321Session`; add `chargeBefore Int? / chargeAfter Int?` there if absent).
- **Phase C**: new `TapTheVeinIdea` (id, dailySessionId, text, fate
  `kept|merged|vaulted|composted`, mergedFromIds, createdAt); daily free-deposit
  count derivable from vaulted-today.
- **Phase D**: `TapTheVeinTask.daemonId String?`; allow status `upgraded_to_daemon`.

All cross-system pointers stay `String?` (soft FKs) per the Tier 1 precedent.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Currency | Reuse existing Vibeulon wallet/ledger — no parallel TTV currency. |
| Mint idempotency | `rewardMintedAt` on the task; mint only when null. |
| 3·2·1 store | Reuse `Shadow321Session`; link via `clean321SessionId`. Don't fork a second 321 engine. |
| Economy numbers | ♦ amounts (complete +1, bonus +1, vault 5-free-then-1, quest 3 / daemon 2) are the design's; **confirm against the live economy** before locking. |
| Build order | A first (others depend on mint/spend), then B / C / D in any order. |
| AI | None required — all deterministic. 3·2·1 phrase assist (if added) is opt-in, behind `aiEnabled()`. |

## Functional Requirements (by phase)

- **A1** Completing a task mints ♦+1 exactly once; re-completing is a no-op mint.
- **A2** Work "Reserve" + Seal "Minted" tiles reflect the real ledger.
- **B1** 3·2·1 is optional (Skip path); thread autosaves; voice switcher only on phase 2.
- **B2** Charge drop > 2 mints a ♦+1 bonus, shown as "♦ +2 · 1 base + 1 bonus".
- **C1** Storm dump is timed; ideas are raw (pre-card). Distill caps today's play at 5.
- **C2** First 5 Vault deposits/day free, then ♦1; overflow that isn't kept/vaulted composts.
- **D1** Upgrade creates a real Quest or Daemon, spends ♦, links the id, and is a ceremony.

## Verification Quests (required — UX features)

One cert per phase, framed toward the Bruised Banana fundraiser (engine
improvement). Twine + `isSystem` BAR, idempotent seed:
- `cert-ttv-economy-v1`, `cert-ttv-321-v1`, `cert-ttv-storm-v1`, `cert-ttv-upgrade-v1`.

## Out of scope
- Replacing Tier 1 behavior (it stands).
- A second 321 engine (reuse Shadow321Session).
- Lenses brainstorm seeding (separate thread; Tier 1 already ships the empty state).

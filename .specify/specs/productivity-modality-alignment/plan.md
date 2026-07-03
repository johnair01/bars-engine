# Plan: Productivity Modality Alignment

Implement per [spec.md](./spec.md). Research complete in [RESEARCH.md](./RESEARCH.md).

---

## Phase A — Research authority (DONE in this PR)

| Deliverable | Status |
|-------------|--------|
| RESEARCH_PROMPT.md | Done |
| RESEARCH.md | Done |
| SIX_GAME_MASTER_REVIEW.md | Done |
| SCHEMA_GAPS.md | Done |
| spec.md / plan.md / tasks.md | Done |
| BACKLOG PMA row | Pending seed |

---

## Phase B — Loop wiring (no new schema)

**Goal:** Close gaps with existing models + UX. Highest leverage per RESEARCH Top 5.

### B1 — Next action + Star of Bethlehem

**Target specs:** [golden-path-onboarding-action-loop](../golden-path-onboarding-action-loop/), [golden-path-next-action-bridge](../golden-path-next-action-bridge/), [core-game-loop-audit](../core-game-loop-audit/spec.md)

- Surface `NextActionBridge` on quest detail and post-complete flow
- Compute single "your next move" card on NOW from: active quest w/o next action → TTV incomplete → Lens review due
- On quest complete: cascade promote next blocked sibling (Tandem pattern) in `next-action-bridge.ts`

### B2 — Lens workshop = weekly review

**Target specs:** [lenses-observatory-intake](../lenses-observatory-intake/spec.md), [lens-integration-refactor](../lens-integration-refactor/spec.md)

- Add review cadence copy + steps: carry/compost stale TTV, surface orphan quests, parked goals
- No planner grid — ritual passages only (SIX_GAME_MASTER_REVIEW Lenses guard)

### B3 — PARA semantics

**Target specs:** [quest-lineage-alignment](../quest-lineage-alignment/spec.md)

- Document: `LensGoal` + domain = **Area/Horizon**; active `CustomBar` quest = **Project**
- Handbook + steward docs only unless QLA needs `goalKind` metadata

### B4 — POF streak policy

**Target specs:** [personal-ops-funnel](../personal-ops-funnel/spec.md)

- SPC streak: opt-in, celebratory, no breakage shame (POF GAP_ANALYSIS mitigation)
- BRS: stewardship step must offer "write next action" (GTD clarify output)

### B5 — Document WIP limits

**Target:** [docs/PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md), handbook

- Explicit: 5 TTV tasks = feature; Hand slots = bounded focus

---

## Phase C — Schema (gated)

**Entry criteria:** Phase B complete; waiting-for still unmet in campaign UX.

See [SCHEMA_GAPS.md](./SCHEMA_GAPS.md):

1. Metadata pilot: `PlayerQuest.metadataJson.waitingFor`
2. If query needs grow: `waitingOnPlayerId`, `followUpAt`
3. Cascade persistence only if computed cascade insufficient

**Migration discipline:** `prisma migrate dev` + commit SQL per prisma-migration-discipline skill.

---

## File impact summary

| Area | Files (Phase B examples) |
|------|---------------------------|
| Next action | `src/actions/next-action-bridge.ts`, dashboard components |
| TTV review | `src/actions/tap-the-vein.ts`, TTV close UI |
| Docs | `docs/PLAYER_SUCCESS.md`, Lens spec amendments |
| No change Phase A | `prisma/schema.prisma` |

---

## Out of scope

- OpenGSD player feature import
- Eisenhower / inbox UI
- Habitica-style XP loops
- New standalone productivity dashboard

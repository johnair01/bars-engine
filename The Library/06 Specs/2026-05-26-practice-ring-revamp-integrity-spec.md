---
type: integrity-spec
topic: practice-ring-revamp-program
created: 2026-05-26
last_reviewed: 2026-05-26
status: CLEAN
hexagram: "3 — Difficulty at the Beginning"
process: Integrity Check (Wake Up → Clean Up → Grow Up → Show Up)
vault_mirror_of: bars-engine/.specify/specs/practice-ring-revamp-program/
tags: [integrity, practice-ring, orientation, spec-kit]
---

# Integrity Spec — Practice Ring Revamp Program

**Cast:** Reconcile the Practice Ring revamp program against canonical spec kits before any UI implementation.

**Sources of truth:**

| Layer | Path |
|-------|------|
| Program coordinator | `bars-engine/.specify/specs/practice-ring-revamp-program/` |
| Practice Ring home | `bars-engine/.specify/specs/practice-ring-home-revamp/` |
| Orientation flow | `bars-engine/.specify/specs/practice-orientation-flow/` |
| Metabolize→Deck | `bars-engine/.specify/specs/bar-metabolize-deck-pipeline/` |
| Shipped behavior | `bars-engine/src/` |

---

## Phase 1 — Wake Up (gap table)

| # | Category | Gap | Severity | Reconciliation | Status |
|---|----------|-----|----------|----------------|--------|
| G1 | No source | Spec kits did not exist in `.specify/specs/` | High | Phase 0 authored four kits | **RESOLVED** |
| G2 | Format drift | Cursor plan not spec-kit compliant | High | All kits use spec-template + frontmatter | **RESOLVED** |
| G3 | Overlap | PHOS assumed character-first onboarding | High | Supersession note in PHOS; `practice-orientation-flow` owns platform onboarding | **RESOLVED** |
| G4 | Overlap | PMIA partial duplicate of Practice Ring | Medium | `practice-ring-home-revamp` = Phase 1 slice of PMIA Now tab | **RESOLVED** |
| G5 | Conflict | onboarding-flow-completion global nation/archetype | High | Scoped to event-local (`campaignRef=bruised-banana`) | **RESOLVED** |
| G6 | Drift | DASHBOARD_DESIGN BB-scoped | Low | Cited in practice-ring-home-revamp spec | **RESOLVED** |
| G7 | Missing link | No single Capture→Metabolize→Deck spec | High | `bar-metabolize-deck-pipeline` kit | **RESOLVED** |
| G8 | Vault mirror | Dual copies pattern | Low | Vault folders under `06 Specs/<spec_kit_id>/` | **RESOLVED** |
| G9 | Blank tier | No cert quests planned | High | cert-*-v1 defined in each UX kit tasks.md | **RESOLVED** (spec); seed in Phase 1+ |
| G10 | Schema unnamed | Readiness/entitlement fields implied | Medium | Documented in orientation + program kits; migrate in Phase 0.5 | **DOCUMENTED** |
| G11 | Ontology | BAR definition / nomenclature unsettled ("Brave Act of Resistance" vs playful VFD-style reveal) | Low | Backlog **1.78 BOD** — spec kit when ready; orient `bars` copy provisional | **DEFERRED** |

---

## Phase 2 — Clean Up

- [x] Four spec kits authored (`spec.md`, `plan.md`, `tasks.md`)
- [x] Vault mirrors with integral design face cards
- [x] PHOS, onboarding-flow-completion, PMIA supersession notes
- [x] Verification quest IDs assigned (seed deferred to implementation phases)

---

## Phase 3 — Grow Up (encoded rules)

| Pattern | Rule |
|---------|------|
| Plan-without-spec-kit | Block implementation until `.specify/specs/` kit exists |
| Platform orientation | One default: `practice-orientation-flow`; events inherit, never re-gate character globally |
| UX without cert quest | Feature incomplete until `cert-*-v1` seeded |

---

## Phase 4 — Show Up

| Check | Result |
|-------|--------|
| Spec kits exist (4/4) | **PASS** |
| Each kit has spec + plan + tasks | **PASS** |
| Overlap reconciliation documented | **PASS** |
| Verification quests defined in specs | **PASS** |
| Cert quests seeded in DB | **DEFERRED** — Phase 1+ implementation |

---

## Phase 5 — Close Out

- **Integrity status:** **CLEAN** for Phase 0 (spec authoring). Implementation phases 0.5–5 remain **draft** on child kits.
- **Next gate:** Phase 0.5 may begin (`practice-orientation-flow` tasks Phase 1).
- **AAR:** `The Library/01 Daily Notes/LOGS/AAR_2026-05-26_practice-ring-phase0-spec-kits.md`

---

## Implementation phase gate

| Phase | Kit | Blocked until |
|-------|-----|---------------|
| 0.5 | practice-orientation-flow | This integrity spec = CLEAN ✓ |
| 1 | practice-ring-home-revamp | 0.5 player-readiness decouple started |
| 2 | entitlements (program) | Phase 1 home revamp |
| 3 | bar-metabolize-deck-pipeline | Phase 0.5 + dominion deck paths |

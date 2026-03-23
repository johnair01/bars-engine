# Plan: Campaign hub → spoke CYOA → card landings

Implement per [.specify/specs/campaign-hub-spoke-landing-architecture/spec.md](./spec.md).

## Phase A — Data model & period bundle

- Campaign **topology choice**: 52 vs 64; persist deck identity and card/landing keys.  
- **Period** record: `kotterTheme` / period index, **`hexagramOrder: int[8]`** (or hexagram ids) from **one cast**, **milestone ids**, link to campaign deck slice if needed.  
- Optional **`PlayerCampaignAlchemyTrace`** or JSON slice: hub id, spoke id, move choice, face choice, alchemy phase → next node.

## Phase B — Hub & routes

- Hub route (page v1); **8 spoke entry points** each starting the **same or parameterized** CYOA with `spokeIndex`.  
- Landing route keyed by `(campaignRef, periodId, spokeIndex)` resolving to **card** + **hexagram** copy.

## Phase C — CYOA templates (inventory)

- **Template catalog**: epiphany-bridge pattern; passages 1–2 = move + face; emission hooks → BAR / side quest + **vault capacity check** → **hard block** + **modal compost** ([vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md)).  
- Document **inventory matrix**: which template emits what, limits, idempotency.  
- **CYOA persistence:** implement **session-only** or **checkpoint + revalidate** (see spec table); avoid blind resume that ignores alchemy state.

## Phase D — Creator flows

- **Campaign deck** creation wizard (52/64).  
- **Milestone interview** (parallel to 321 interview UX patterns) → persisted milestones.  
- **Period start**: trigger **one I Ching cast** → store **spoke order**; invalidate/rebuild landing copy cache if any.

## Phase E — Landing room

- Roster: players who completed spoke **k** this period; NPCs filtered by path + alchemy tags.  
- Surface **card** metaphor in UI (title, suit, Kotter hook, hexagram name).

## Dependencies

- Existing I Ching actions and persistence ([scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) appendix patterns).  
- Vault queries and limits.  
- CYOA / Twine or modular graph execution path used elsewhere.

## Verification

- `npm run build` / `npm run check` for touched code.  
- Manual: one campaign, one period, cast → 8 landings labeled; spoke CYOA → vault emission → gate when vault full.

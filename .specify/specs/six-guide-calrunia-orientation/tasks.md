# Tasks: Six Guide Campaigns — Calrunia Orientation and Unlock Ladder

## Spec Kit

- [x] T1: Create `spec.md` capturing the orientation problem, six Guide campaigns, unlock ladder, and Calrunia portal logic.
- [x] T2: Create `plan.md` with phased documentation-first implementation strategy.
- [x] T3: Create `tasks.md` as the working checklist.

## Design Authority Artifacts

- [x] T4: Create `GUIDE_CAMPAIGN_MATRIX.md` summarizing all six Guides in one table.
- [ ] T5: Create `PORTAL_EVENTS_AND_UNLOCKS.md` defining Portal Events, unlock types, and initial unlock rules.
- [ ] T6: Create `CHARACTER_IDENTITY_BETWEEN_WORLDS.md` sketching the future player identity/passport model.
- [x] T6A: Create `CALRUNIAN_OPPOSITION_MATRIX.md` grounding Guide campaign antagonists in existing Calrunia lore and world logic.
- [x] T6B: Create `BARS_CALRUNIA_WORLD_MECHANICS.md` exploring how BARs move between outer-world behavior and inner-world Calrunian play, with mechanics options rooted in existing bars-engine systems.
- [x] T6C: Create `INNER_GARDEN_IMPLEMENTATION_RESEARCH.md` mapping the six Guide game types onto the inner-garden room, Guide NPC, nursery, BAR planting, and campaign hub structures already in bars-engine.
- [x] T6D: Update `INNER_GARDEN_IMPLEMENTATION_RESEARCH.md` to incorporate the separate Library inner-garden prototype as the richer source design for farming, cultivation, deck/manual, BAR-to-card, and advocate systems not yet fully integrated into bars-engine.
- [x] T6E: Create `PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md` with six Game Master analysis, deprecation/integration framing, bridge model, and user interview questions.
- [x] T6F: Update `PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md` with interview findings: two-game hierarchy, full Pixi runtime retirement after concept porting, Shaman/Hand/Vault first loop, and routes-without-Pixi guidance.

## Six Guide Outlines

- [ ] T7: Create `guides/shaman.md` with promise, lessons, quests, unlocks, and lore doorway.
- [ ] T8: Create `guides/challenger.md` with promise, lessons, quests, unlocks, and lore doorway.
- [ ] T9: Create `guides/regent.md` with promise, lessons, quests, unlocks, and lore doorway.
- [ ] T10: Create `guides/architect.md` with promise, lessons, quests, unlocks, and lore doorway.
- [ ] T11: Create `guides/diplomat.md` with promise, lessons, quests, unlocks, and lore doorway.
- [ ] T12: Create `guides/sage.md` with promise, lessons, quests, unlocks, and lore doorway.

## Product Integration Review

- [ ] T13: Audit existing app surfaces and map each to an orientation layer: BARs, Move Generator, Superpower, Emotional Alchemy, Nations, Sects, I Ching, Calrunia.
- [ ] T14: Identify which existing surfaces should be hidden, visible-but-locked, or always available.
- [ ] T15: Decide first implementation slice: Shaman Guide, Sage Guide, or six-card Guide selection only.

## Runtime Design Prep

- [ ] T16: Draft `GuideFace`, `GuideStatus`, `UnlockKind`, and `PortalEventKind` type contracts.
- [ ] T17: Draft an authored Guide registry shape.
- [ ] T18: Draft a migration/persistence strategy for Guide progress only if needed by the first implementation slice.

## Inner Garden Shaman Bridge Implementation

- [x] T23: Add implementation phase to `plan.md` for the Inner Garden Shaman bridge.
- [x] T24: Add pure bridge schema and eligibility helpers for `bars-inner-garden.v1` and `inner-garden-bars.v1`.
- [x] T25: Add server actions to list eligible raw Hand/Vault capture BARs, build import payloads, and complete Shaman runs.
- [x] T26: Add authenticated `/inner-garden` entry route listing eligible raw BARs.
- [x] T27: Add `/inner-garden/shaman?barId=...` route for the first Shaman cultivation loop.
- [x] T28: Deprecate normal Pixi `/world/:instanceSlug/:roomSlug` runtime via redirect unless the prototype flag is enabled.
- [x] T29: Add and run eligibility/bridge tests.

## Inner Garden Chapter 1 Playable Slice

- [x] T30: Add Phase 7 to `plan.md` defining Chapter 1 as the first playable Inner Garden threshold ritual.
- [x] T31: Add pure Chapter 1 constants/builders for source BAR and result BAR metadata.
- [x] T32: Extend Inner Garden server actions to complete Chapter 1 from an existing raw BAR or a newly named call.
- [x] T33: Add authenticated `/inner-garden/chapter-1` route with eligible BAR selection and create-from-call flow.
- [x] T34: Link MTGOA Spoke I to `/inner-garden/chapter-1`.
- [x] T35: Add pure tests for Chapter 1 builders and run targeted verification.
- [x] T36: Add three Chapter 1 starter situations for first-time playtesters who do not bring a raw BAR.
- [x] T37: Capture optional Chapter 1 playtest feedback in result BAR metadata.

## Acceptance Review

- [ ] T19: Confirm the team can state the Calrunia portal rule in one sentence.
- [ ] T20: Confirm each Guide has a player need prompt, not only a face name.
- [ ] T21: Confirm each Guide unlock maps to a practice the player has learned.
- [ ] T22: Confirm lore pages are attached to actions, unlocks, or Guide progress.

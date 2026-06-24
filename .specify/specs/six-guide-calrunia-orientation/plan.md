# Plan: Six Guide Campaigns — Calrunia Orientation and Unlock Ladder

## Objective

Create the canonical product architecture for orienting Mastering Allyship players into Calrunia through six Game Master Guide campaigns and progressive app unlocks.

This plan is intentionally documentation-first. The next implementation should follow after the orientation model, guide outlines, and unlock taxonomy are stable.

## Phase 1 — Orientation Authority

Define the orientation ladder and the reason Calrunia appears.

Artifacts:

- `spec.md`
- `GUIDE_CAMPAIGN_MATRIX.md`
- `PORTAL_EVENTS_AND_UNLOCKS.md`

Key decisions:

- BARs remain outer-world utility.
- Superpowers are first identity layer.
- Game Master faces are game modes.
- Emotional Alchemy opens the nation layer.
- Sects follow nations as disciplines.
- I Ching bridges outer-world artifact, inner-world narrative data, and outer-world move.

## Phase 2 — Six Guide Campaign Outlines

Create one outline per Guide:

- Shaman
- Challenger
- Regent
- Architect
- Diplomat
- Sage

Each outline should include:

- campaign promise
- player need prompt
- lessons
- core loop
- unlocks
- first 3-5 quests
- lore pages introduced
- success / completion state

Candidate files:

```text
.specify/specs/six-guide-calrunia-orientation/guides/shaman.md
.specify/specs/six-guide-calrunia-orientation/guides/challenger.md
.specify/specs/six-guide-calrunia-orientation/guides/regent.md
.specify/specs/six-guide-calrunia-orientation/guides/architect.md
.specify/specs/six-guide-calrunia-orientation/guides/diplomat.md
.specify/specs/six-guide-calrunia-orientation/guides/sage.md
```

## Phase 3 — Unlock Taxonomy

Define unlock types and initial candidates.

Unlock classes:

- app surface
- lore page
- move-generator mode
- campaign route
- oracle/interpreter
- identity/title
- role/campaign responsibility

Needed decisions:

- Which capabilities are hidden by default?
- Which capabilities are visible but locked?
- Which capabilities are simply "introduced" through Guide completion?
- Which unlocks require persistence?

## Phase 4 — Runtime Model Draft

Before implementation, design minimal types:

```ts
type GuideFace = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
type GuideStatus = 'locked' | 'available' | 'active' | 'completed'
type UnlockKind = 'app_surface' | 'lore_page' | 'campaign_route' | 'oracle' | 'identity' | 'role'
type PortalEventKind =
  | 'first_bar'
  | 'first_move_generated'
  | 'move_resistance_named'
  | 'superpower_revealed'
  | 'emotional_alchemy_completed'
  | 'nation_revealed'
  | 'sect_pattern_detected'
  | 'iching_cast_completed'
  | 'campaign_impact_returned'
```

Implementation should prefer authored data first, then persistence.

## Phase 5 — First Slice Recommendation

The first implementation slice should not build all six campaigns.

Recommended first slice:

1. Add a Guide selection/orientation document or simple UI surface.
2. Define the six Guide cards with player need prompts.
3. Add one unlock path for the Shaman or Sage Guide.
4. Connect completion to one meaningful existing surface:
   - Shaman -> Emotional Alchemy / 3-2-1
   - Sage -> I Ching / oracle candidate

Why:

- Shaman validates the charge-to-nation path.
- Sage validates the I Ching-to-sect path.
- Both directly support the current design pain point.

## File Impacts

Documentation:

- `.specify/specs/six-guide-calrunia-orientation/spec.md`
- `.specify/specs/six-guide-calrunia-orientation/plan.md`
- `.specify/specs/six-guide-calrunia-orientation/tasks.md`
- future guide outline docs under `guides/`
- possible architecture docs under `docs/architecture/`

Potential runtime later:

- `src/lib/guides/`
- `src/lib/guides/types.ts`
- `src/lib/guides/registry.ts`
- `src/app/mastering-allyship/guides/page.tsx`
- `src/app/mastering-allyship/guides/[face]/page.tsx`
- player/profile persistence for guide completion

## Risks

- Too much lore too early.
- Unlocks feeling like artificial restriction instead of curriculum.
- Confusing superpower, nation, sect, and face as competing identities.
- Treating I Ching as flavor instead of recommendation logic.
- Building a new Calrunia surface before the existing Move Generator and campaign flows are used as orientation portals.

## Verification

Early verification is design review, not tests:

- Can a new player explain what a BAR is before hearing about Calrunia?
- Can a player choose a Guide based on need?
- Can each Guide unlock be justified as "you learned the practice needed for this"?
- Can the I Ching path produce a concrete outer-world move?
- Can the team say which layer a feature belongs to?

## Phase 6 — Inner Garden Shaman Bridge Implementation

This phase makes the first executable bridge from bars-engine into Inner Garden while retiring Pixi as the canonical Calrunian runtime.

Implementation decisions:

- Use this spec kit as the authority for v1.
- V1 is Shaman only.
- V1 accepts only raw personal capture material:
  - `CustomBar.type` is `bar` or `charge_capture`
  - current player is the creator
  - `status` is `active`
  - `archivedAt` is null
  - `isSystem` is false
  - `inviteId` and `mergedIntoId` are null
  - effective maturity is `captured`
- V1 stores completion as a new `CustomBar`; no new tables.
- Inner Garden result BARs set:
  - `sourceBarId` to the source BAR
  - `gameMasterFace` to `shaman`
  - `questSource` to `inner_garden_shaman`
  - Shaman run details in `agentMetadata`
  - post-Shaman maturity in `seedMetabolization`
- Pixi `/world/:instanceSlug/:roomSlug` route remains but redirects to `/inner-garden` unless `ENABLE_PIXI_WORLD_PROTOTYPE` is enabled.

Runtime files:

```text
src/lib/inner-garden/bridge.ts
src/actions/inner-garden.ts
src/app/inner-garden/page.tsx
src/app/inner-garden/shaman/page.tsx
src/app/world/[instanceSlug]/[roomSlug]/page.tsx
```

Acceptance criteria:

- A player can choose a raw Hand/Vault capture BAR from `/inner-garden`.
- `/inner-garden/shaman?barId=...` rejects ineligible BARs.
- Completing the Shaman form creates a new Vault BAR linked to the source.
- Normal Pixi world traffic redirects to Inner Garden unless the prototype flag is enabled.

## Phase 7 — Inner Garden Chapter 1: Answer The Call

This phase turns the bridge into the first playable Mastering the Game of Allyship chapter.

Product frame:

- Chapter 1 is **The Call to Play / Answer the Call**.
- It is a threshold ritual, not a lore reader.
- It teaches the first allyship practice: notice the signal, name the charge/resistance, and choose one concrete first move.
- It uses the Shaman loop because the first thing the player must learn is that charged inner material is playable, not disqualifying.

Implementation decisions:

- Add `/inner-garden/chapter-1` as the authenticated playable route.
- Let a player start from either:
  - an existing eligible raw Hand/Vault BAR, or
  - a new "Call to Play" BAR created from the Chapter 1 form.
- Provide three starter situations for first playtests so a player can try the loop without bringing private material or already knowing BAR capture.
- Store all output in `CustomBar`.
- Do not introduce campaign progress tables in v1.
- Use `questSource: "inner_garden_chapter_1"` to distinguish Chapter 1 completions from generic Shaman runs.
- Set Chapter 1 result metadata:
  - `gameMasterFace: "shaman"`
  - `campaignRef: "mtgoa-chapter-1"`
  - `allyshipDomain: "RAISE_AWARENESS"`
  - `moveType: "wakeUp"`
  - `sourceBarId` when a source BAR exists or is created
  - `agentMetadata` with signal, resistance, emotion, cultivation action, seed quality, harvested insight, and first move
- Store optional playtest feedback in `agentMetadata` so the team can assess whether Chapter 1 felt clear and useful outside the app.
- Link MTGOA Spoke I to `/inner-garden/chapter-1` so the public hub's first card opens the playable chapter instead of only a reading surface.

Runtime files:

```text
src/lib/inner-garden/chapter-one.ts
src/actions/inner-garden.ts
src/app/inner-garden/page.tsx
src/app/inner-garden/chapter-1/page.tsx
src/lib/mastering-allyship/spoke-funnel-map.ts
src/lib/inner-garden/__tests__/chapter-one.test.ts
```

Acceptance criteria:

- `/inner-garden/chapter-1` requires auth.
- The page lists eligible raw Hand/Vault BARs and also supports creating a new Chapter 1 source BAR.
- The page offers starter situations for first-time playtesters.
- Completing the Chapter 1 form creates exactly one result BAR and, when needed, one source BAR.
- The result BAR is linked to the source BAR, tagged as Shaman + Chapter 1, and includes the player's first outer-world move.
- The result BAR preserves optional playtest feedback in `agentMetadata`.
- MTGOA hub Spoke I points to the playable Inner Garden Chapter 1 route.
- Pure tests prove the Chapter 1 metadata and BAR draft builders are stable.

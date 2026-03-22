# Tasks: Scene Atlas Game Loop

## Spec kit

- [x] Add `.specify/specs/scene-atlas-game-loop/spec.md`
- [x] Add `.specify/specs/scene-atlas-game-loop/plan.md`
- [x] Add `.specify/specs/scene-atlas-game-loop/tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md`

## Phase 1 — Discoverability (IA)

- [x] **Dashboard / home:** Add a **Personal throughput** (or “Your compass”) block: Charge CTA, link to **Scene Atlas** (`/creator-scene-deck`), link to **Hand**; add **Collective / Campaign** block: active campaign link, **Cast I Ching** when `instanceId` / campaign context is available (pass-through stub OK).
- [x] **Hand page:** Add **Scene Atlas** card/row with `SCENE_ATLAS_TAGLINE` (from `branding.ts`) + link.
- [ ] **Wiki (optional):** Short `/wiki/game-loop` or extend `/wiki/player-guides` with personal vs collective one-pager linking Scene Atlas + I Ching.

## Phase 2 — North star

- [x] Decide storage: `storyProgress.northStar` **or** new `Player` field — document in spec appendix when chosen.
- [x] Show north star line on dashboard (empty state copy if unset).
- [ ] Optional: set from orientation completion or profile edit action.

## Phase 3 — Daily Scene Atlas use limit

- [x] Add config: default **N** uses/day (e.g. `SCENE_ATLAS_DAILY_LIMIT` env or constants file).
- [x] Persist per-player daily counter (merge into `storyProgress` or Prisma).
- [x] Enforce in **`createCustomBar`** / **`bindSceneGridCardToExistingBar`** (reject when over limit; clear message).
- [x] UI: show “**X / N** Scene Atlas answers today” on `SceneDeckClient` (or bind modal).

## Phase 4 — I Ching (collective) context

- [x] Extend **`castIChing` / casting pipeline** to accept optional **`instanceId`**, **`campaignRef`**, and/or **`threadId`**.
- [x] Update **campaign** or **gameboard** entry points to pass context when opening cast UI.
- [x] Persist reading + context (minimum viable: JSON on `Player` / `storyProgress` **or** new table — task sub-bullet in PR).
- [x] Copy: “Cast for this campaign” vs global `/iching`.

## Phase 5 — Wii Sports–style demos

- [x] Add **`/play`** (or `/try`) route with **3 demo cards**: Charge → Scene Atlas one cell → I Ching micro-quest (link out to existing flows).
- [x] Link **Try it** row from dashboard.
- [ ] Optional: `QuestThread` with `threadType: 'demo'` + seed script.

## Verification

- [ ] `npm run check` on touched files
- [ ] Manual: new player sees two-lane mental model; Scene Atlas reachable without wiki-only path

# Tasks: Player Handbook & Orientation System (PHOS)

## Phase 0 — Define success (required before code)

- [x] **T0.1** Write `docs/PLAYER_SUCCESS.md`: what a successful BARS player looks like at 1 / 10 / campaign-complete in game terms.
- [x] **T0.2** Produce `HANDBOOK_DRAFT.md` in this folder: four moves, one action each, one deep link each (draft form).
- [x] **T0.3** Identify and list the three felt-sense touchpoints with component/file name; record decision here before Phase 3 starts.
- [x] **T0.4** Cross-check handbook outline against wiki/moves, wiki/player-guides, and hand/moves pages — avoid contradiction; note merges needed.

## Phase 1 — Handbook entry point

- [x] **T1.1** Create `src/app/wiki/handbook/page.tsx` structured by four moves (static, no DB).
- [x] **T1.2** Add `/wiki/handbook` link to `src/app/wiki/player-guides/page.tsx` under "Start here" section.
- [x] **T1.3** Add page-header subtitle to NOW, VAULT, PLAY answering "what can I do here?" (one line each, static copy).

## Phase 2 — Orientation compass on NOW

- [x] **T2.1** Build `OrientationCompass` component — reads player's last session context; shows move + one next action.
- [x] **T2.2** First-visit path: "Start with Wake Up → capture a charge" CTA when no history.
- [x] **T2.3** Wire into `src/app/page.tsx` above main sections (non-intrusive).

## Phase 3 — Felt-sense scaffolding

- [x] **T3.1** Add one-line copy to charge capture opening (`src/app/capture/page.tsx`).
- [x] **T3.2** Add one-line copy to 321 shadow opening (`src/app/shadow/321/page.tsx`).
- [x] **T3.3** Add one-line copy to quest unpack (`src/app/quest/[questId]/unpack/page.tsx`).

## Phase 4 — Library → player discovery

- [x] **T4.1** Used existing `moveType` field (camelCase DB values) — no schema change needed. Discoverability = `completionEffects` contains `source: library`. Decision recorded in `scripts/set-praxis-move-types.ts`.
- [x] **T4.2** Admin can set `moveType` via existing quest review interface; praxis pillar visible in `BookList` via `BookPraxisBadge` (LPP). No additional admin field needed.
- [x] **T4.3** `DiscoverStrip` component added to NOW page, below OrientationCompass; queries `getLibraryQuestsForMove(recommendedMoveType)`.
- [x] **T4.4** `scripts/set-praxis-move-types.ts` propagates `moveType` from pillar for quests without a type; existing quests retain AI-assigned types from analysis pipeline. Also fixed OrientationCompass bug: was checking `clean_up`/`grow_up` instead of `cleanUp`/`growUp`.

## Phase 5 — Navigation (after PMI P0)

- [x] **T5.1** First PMI synthesis affordance (**G1**): NOW orders **identity → OrientationCompass → DiscoverStrip** before campaign/charge/social blocks; tagline + handbook link sit **below** the compass (compass is no longer preceded by extra copy). **FR6:** NavBar `title` tooltips on NOW / VAULT / PLAY answer “what can I do here?” without leaving the tab.

## Verification

- [x] **TV.1** `npm run check` passes (0 errors) after all phases.
- [x] **TV.2** Manual smoke: new player can reach one "do" action from NOW without leaving page — verify OrientationCompass CTA + DiscoverStrip links after login.
- [x] **TV.3** Handbook page readable without login; actions deep-link correctly when logged in — `/wiki/handbook` is static; move links point to `/`, `/hand`, `/adventures`, `/capture`, etc.

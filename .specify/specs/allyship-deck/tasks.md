# Tasks: Allyship Deck

Implements [spec.md](./spec.md) per [plan.md](./plan.md). Data-first. No DB in v1.

## Phase 1 — Deck data + assembly
- [ ] **T1** — `src/lib/allyship-deck/types.ts`: `AllyshipDeck`, `AllyshipCard`, `AllyshipMove` (5 moves incl. placeholder 5th).
- [ ] **T2** — `scripts/assemble-allyship-deck.ts` (`npm run deck:assemble`): build `public/allyship-deck/allyship-deck.json` from `deck-templates/*` + `card-art-registry` + `move-grammar`. Deterministic; placeholder `prompt`/`guidance` where author copy is pending; honor quarantine list.
- [ ] **T3** — Commit the generated `allyship-deck.json` (so the reader works before author copy lands).

## Phase 2 — Digital consultable deck
- [ ] **T4** — `src/app/deck/{layout,page}.tsx` — `/deck` route (mirror `/oracle` + `/handbook`).
- [ ] **T5** — `src/components/deck/AllyshipDeckReader.tsx` forked from `OracleReader`: draw (shuffle), browse (grid + filter by move/domain), single card (prompt + guidance).
- [ ] **T6** — `src/components/deck/ConsultIndex.tsx`: problem picker from `deck.problems` → highlight recommended cards.

## Phase 3 — Guidebook
- [ ] **T7** — `src/components/deck/GuidebookPanel.tsx`: in-app how-to + problem index.
- [ ] **T8** — guidebook export (markdown/PDF) from the same data (`npm run deck:guidebook`).

## Phase 4 — Print-house export
- [ ] **T9** — `src/lib/deck/cardLayout.ts` (reuse Oracle geometry) + print constants (default 2.5×3.5 @300dpi, 0.125" bleed; env/flag overridable).
- [ ] **T10** — `scripts/export-allyship-deck.ts` (`npm run deck:export`): Playwright render fronts + shared back → `/output/allyship-deck/` + `manifest.json`; skip + report quarantined cards. Add `/output/allyship-deck/` to `.gitignore`.
- [ ] **T11** — Verify one front + back at 300dpi before batch; confirm bleed/size in manifest.

## Phase 5 — (optional) Sell the digital deck
- [ ] **T12** — If gated: `DeckEntitlement` model + migration + `redeemDeckLicense` (mirror book paywall). Add § Persisted data then.

## Verification Quest (required)
- [ ] **T13** — Twine `cert-allyship-deck-v1` (5 steps per spec); final passage no-link.
- [ ] **T14** — `scripts/seed-cert-allyship-deck.ts` + `npm run seed:cert:allyship-deck` (idempotent; `isSystem`/public; Bruised Banana frame).
- [ ] **T15** — Run end-to-end in preview.

## Open inputs to collect from author (track, non-blocking)
- [ ] 5th move name + meaning (replace `open_up` placeholder).
- [ ] Per-card copy: `title`/`prompt`/`flavor`/`guidance`.
- [ ] `problems` index entries + guidebook copy.
- [ ] Print house target → final size/bleed.
- [ ] Access model (free vs sold) → whether Phase 5 runs.

## Definition of done (v1: digital + print, content-pending)
- [ ] `npm run deck:assemble` produces valid JSON; committed.
- [ ] `/deck` draws, browses/filters, consults, shows guidebook.
- [ ] `npm run deck:export` produces print-spec files + manifest for all non-quarantined cards.
- [ ] `npm run check` + `npm run build` green; verification quest seeded + passing.
- [ ] BACKLOG `1.81 ADK` updated; `npm run backlog:seed`.

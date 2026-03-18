# Portal Path Hint Redesign — Tasks

## Phase 1: Data Model & Cast Logic

- [x] **1.1** Add `changingLines: number[]` to portal cast — simulate coin cast per hexagram when drawing 8 portals
- [x] **1.2** All 8 portals now have changing lines (1–3 per cast); filter was not needed since we always simulate changing lines
- [x] **1.3** Extend `PortalData` type with `changingLines`, `primaryFace` (lowest changing line → face)

## Phase 2: Path Hint Generation

- [x] **2.1** Extend `contextualizeHexagramForPortal` to accept `hexagramText`, `changingLines`, `primaryFace`
- [x] **2.2** Face-specific templates in `portal-context.ts` via `FACE_PATH_HINT_TEMPLATES`
- [x] **2.3** Populate `FACE_PATH_HINT_TEMPLATES` from GM interview responses (see LOBBY_ANALYSIS_AND_GM_INTERVIEW.md §7)
- [x] **2.4** Replace generic `pathHint` in `portal-context.ts` with generated hint

## Phase 3: Refinement & Testing

- [x] **3.1** Run `npm run build` and `npm run check`
- [ ] **3.2** Manual test: `/campaign/lobby?ref=bruised-banana` — verify path hints are hexagram- and face-specific
- [ ] **3.3** Verify only portals with changing lines appear (if filter implemented)

## Phase 4: Optional — Story Clock Integration

- [ ] **4.1** If using Story Clock sequence for portals, assign changing lines per period
- [ ] **4.2** Wire lobby to use Story Clock hexagrams instead of random draw

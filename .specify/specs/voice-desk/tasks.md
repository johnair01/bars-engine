# Tasks: The Teaching Desk

proof: step 3's gate run on Tap the Vein listed in its pull request; the pencil's picture on a look row (step 4); the desk's stills from `scripts/local/dev.sh shot` in a look row (step 6); his first sitting (step 7)
preview: none (Vercel builds production only since 2026-11-04); every step tests on the local server per `docs/LOCAL_FIRST_TESTING.md`

## Step 1: spec kit

- [x] T001 [claude] This folder: spec, plan, tasks, game frame and two role files; `contract_check.py --through analyze` holds (FR-001 to FR-028 named)

## Step 2: seed and export

- [x] T002 [claude] `content/voice/` with the four files; lexicon seeded from `glossary.ts` (faces, moves, BAR, charge) plus ribbon, face, sitting, pull with empty `plain`; empty bank; chart defaults; `screens.yaml` with the Tap the Vein screens (FR-001)
- [ ] T003 [claude] Collection `voice` in `src/lib/board/save.ts` and the council's `schema/board-save.schema.json`, with fixtures in both repos, as a pair of pull requests (FR-002)
- [ ] T004 [claude] The saves route marks owner-cookie `voice` saves `wendell` and strips a body's mark; a token save is never marked; route test (FR-003)
- [ ] T005 [claude] `GET /api/board/voice?after=` behind COUNCIL_MENU_TOKEN; route test (FR-004)
- [x] T006 [claude] `foldVoice` in `src/lib/voice/export.ts` and `scripts/voice-export.ts` (`--from`, `--check`); a vitest per event kind, a byte-identical rerun, and the refusals (FR-005)

## Step 3: the gate and the packet

- [ ] T007 [claude] `copy-scan.py --lexicon` with the watched-word, banned, screen, rewritten-line and coinage rules; inside `check.sh --build` (FR-006, FR-007, FR-008, FR-009, FR-010, FR-011)
- [ ] T008 [claude] Run it on Tap the Vein and list every hit in the pull request; read the first falsify bullet against the result before step 4 starts (FR-012)
- [ ] T009 [claude] `scripts/voice-packet.py <screen>`; point the no-ai-slop skill and the concrete-referent rule at it (FR-013)

## Step 4: the pencil

- [ ] T010 [claude] Row field `copy` in `rows.ts` and `post_rows.py`; the pencil on the council board's look rows; Enter, tap-out, Escape and unchanged-line cases; a picture of it in use before ready (FR-014)

## Step 5: the redraft source

- [ ] T011 [claude] `POST /api/admin/voice/slips`: stops, up to three checked redrafts with the packet in the prompt, admin only, shipped copy only (FR-015, FR-016)
- [ ] T012 [claude] The two unlabelled sets for the ribbon screen, recorded per redraft and hidden from the desk (FR-017)

## Step 6: the desk

- [ ] T013 [claude] Stills first: the desk with a slip, the apprentice's stop, the turned redrafts, the hatch, the ink stone, the close; `assets_here.py` and art direction before drawing; a look row with the pictures (FR-018, FR-019, FR-020, FR-021, FR-023)
- [ ] T014 [claude] After his yes: the desk at `/admin/voice-desk` with the Impeccable skill and the aesthetic contract (FR-018, FR-019, FR-020, FR-021, FR-022, FR-023)
- [ ] T015 [claude] The four encounters: Tally, Seal, Short Sitting close, Reading Circle with its consent page; no count anywhere (FR-024, FR-025, FR-026, FR-027)
- [ ] T016 [wendell] Walk the Verification Quest from the look row (FR-019, FR-020, FR-021, FR-023)

## Step 7: the first sitting

- [ ] T017 [claude] Load the ribbon screen's nine lines as slips, five then four, and post the sitting on the board (FR-028)
- [ ] T018 [wendell] Sit the two sittings (FR-028)
- [ ] T019 [claude] Ship his kept lines to Tap the Vein; the gate passes on that screen; read the falsify bullets and the Style A read (FR-028, FR-017)

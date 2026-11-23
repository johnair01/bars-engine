# Plan: The Teaching Desk

primitives: mechanics `eye-mark`, `card-turn`, `compost-hatch`, `tuning-bench` (six-faces-council `canon/mechanics/`, checked against `canon/play-canon.md`); the chalk ring already built (`public/marks/chalk.js`); the board-save store (`BoardSave`, `POST /api/board/saves`); the glossary (`src/lib/allyship-deck/glossary.ts`); `scripts/copy-scan.py` and the concrete-referent rule; the kneeling brush-hand cultivation figure (`/mnt/project-files/3d-build/brush-hand-cult-5/`)
footing: vf-desk-look-1 (B), vf-face-names-1 (B), copy-edit-door-1 (A), pm-mark-look-1 (A, the chalk ring), copy-scan-gate-1 (C), positions vf-teacher-not-clerk, vf-lexicon-home, vf-first-slips, vf-gate-scope, vf-style-a-scope, dusk-test-figure-deprecated, jev-select-only
tier: Convened; pass voice-forge-1_2026-11-17 sealed in the store, with his two board answers of 2026-11-17 and his pencil answer of the same day
scout: rung 1, we have it: the chalk ring script, the board-save store and its owner check, the glossary's definitions, copy-scan's string extraction and `--ask`, and the kneeling figure all exist; the only new parts are the `voice` collection, the export, the gate rule, the packet, the pencil, the redraft job and the desk screen. Nothing is installed
skills: design-ontology, six-faces, primitives, brief-master, intake_check, scout, game_frame_check, art-direction, concept, assets_here
skipped: better - the ask arrived as his six-question unpack plus three answered board rows; nothing was left vague to deepen
skipped: asset_callsheet - this spec draws no new asset (`assets: none` in spec.md); the desk reuses brush-hand-cult-5

## Constitution check

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | his three answers are on the board; five positions stand unless flipped; this spec raises no new question |
| 2 The player comes first | pass | `game-frame.md` starts from him kneeling at the desk; the player-side rule is that no screen uses a word it has not shown |
| 3 Primitives and footing | pass | lines above |
| 4 Ontology invariants | pass | nothing scores him (FR-027); consent is asked at the read (FR-026); no player's writing reaches AI (FR-016) |
| 5 Cheapest proof first | pass | the gate runs on Tap the Vein in step 3, before any desk art, and the first falsify bullet can stop the desk there |
| 6 Tool before build | pass | scout line above; the chalk ring and figure are reused, not redrawn |
| 7 Something to see | pass | the desk's concept still exists (`/mnt/project-files/voice-forge/still/desk.png`); step 4 carries a pencil picture and step 6 a look row with stills |
| 8 Reserved items | pass | canonical prose stays his: only `marked_by: wendell` is law, set by the server |
| 9 One session, one piece | pass | seven steps, one pull request each, from `/mnt/project-files/voice-forge/build-handoff.md` |
| 10 Transcend and include | pass | copy-scan, the concrete-referent rule, the chalk ring and the glossary are kept and extended; Style A's reach is tested, not dropped |

## Approach

Data first, the gate second, the doors last. Step 2 makes the files, the collection and the export, so every later
step has somewhere to write and something to read. Step 3 puts the gate in the build and runs it on Tap the Vein, which
is also the cheapest test of the whole idea: if the gate cannot see "ribbon", the desk would teach a check that does
not work. Step 4 opens the cheaper door (the pencil on the board), so his teaching can start before the desk exists.
Step 5 adds the only AI, behind admin. Step 6 builds the desk as a game surface with the Impeccable skill, stills
first. Step 7 is the first sitting and the ship of its lines.

Two pairs of pull requests cross into six-faces-council: the `voice` collection in the save schema (step 2) and the
`copy` field with the pencil on the board (step 4). Each council half is opened by the same step and named in the
bars-engine pull request.

## Steps and files

| Step | Files | Model |
|---|---|---|
| 2 Seed and export | `content/voice/{lexicon.yaml,bank.jsonl,chart.yaml,screens.yaml}`, `src/lib/board/save.ts`, `src/app/api/board/saves/route.ts`, new `src/app/api/board/voice/route.ts`, new `scripts/voice-export.ts` and `src/lib/voice/export.ts` with vitest, fixtures; council `schema/board-save.schema.json` and fixtures | Sonnet |
| 3 The gate | `scripts/copy-scan.py` (`--lexicon`), `content/voice/common-words.txt`, `scripts/local/check.sh`, new `scripts/voice-packet.py`, `.claude/skills/no-ai-slop/SKILL.md`, `concrete-referent.md` | Sonnet |
| 4 The pencil | `src/lib/board/rows.ts`; council `board/council-board.html`, `board/post_rows.py` | Sonnet |
| 5 Redraft source | new `src/app/api/admin/voice/slips/route.ts`, `src/lib/voice/redraft.ts` | Sonnet |
| 6 The desk | new `src/app/admin/voice-desk/`, `public/voice-desk/` (the scene, reusing brush-hand-cult-5), new `src/app/voice/read/[token]/` | Sonnet; Opus if its look fails twice |
| 7 First sitting | slips for the ribbon screen; then `src/lib/tap-the-vein/paths.ts` and the screen's header lines | Sonnet |

## Contract notes for the builder

- The export is a pure fold, `foldVoice(files, events) -> files`, in `src/lib/voice/export.ts`; the script only reads
  and writes. Tests call the fold.
- The gate and the packet read only committed files. Neither calls the store.
- Screen ids are stable strings in `screens.yaml`; a file moving changes `files`, never the id.
- The desk's numbers come from the mechanics files (`feel:` blocks), not from this plan, so a tuning-bench change to a
  mechanic reaches the desk without a spec change.

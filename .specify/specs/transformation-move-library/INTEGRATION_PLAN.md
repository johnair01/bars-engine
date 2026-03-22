# Transformation Move Library — Integration Plan (with existing move systems)

**Context:** The v1 library under `src/lib/narrative-transformation/moves/` adds nation/archetype **selection** on top of the **transformation-move-registry**. Other parts of the repo already contain mature, overlapping concepts. This plan maps those systems and proposes consolidation **without** breaking quest grammar or the narrative pipeline.

## 1. Recent commits (last ~7 days) — related work

| Commit (approx) | Area | Relevance |
|-----------------|------|-----------|
| `b6f4595` | **Narrative Transformation Engine** — parse, locks, `moves.ts` → `selectDefaultMoveIds`, seed assembly | **Direct predecessor** of library selection; same pipeline as `seedFromNarrative` + registry |
| `1797573` | **Branched Path Orientation** — `generateBranchedPath`, quest-grammar | Same **WCGS / 4-move** UX surface; different layer (compile vs narrative seed) |
| `606c66c` | **Quest unpack wizard** — 4-move unpack flow | Player-facing WCGS; should stay aligned with registry stage names in copy |
| `9e536d7` | **GM face moves + template library** | Faces ↔ moves; see `orientation-quest` |
| `010407b` | **Move Ecology Phase 4** — specs, backlog, prompts | Strategic; no single “move library” module, but positions nation/move ecology |
| `04dd3b4` | **Charge capture, growth scenes, navigation** | May consume `QuestSeed` / overlays; verify callers don’t assume pre-library selection |
| `f38413b` / `092f6f9` | **Orientation quest packet**, monorepo scaffold | **Face context index** references `TransformationMove`; **bars-core** gained duplicate registry |

**Note:** If `narrative-transformation/moves/` changes are not yet committed, they sit **on top of** `b6f4595`’s `moves.ts` behavior; treat git history + current tree together.

## 2. Mature systems already in the repo (sources of truth today)

### A. Transformation Move Registry (WCGS narrative / BAR path)

- **Path:** `src/lib/transformation-move-registry/` (`registry.ts`, `services.ts`, `types.ts`)
- **Role:** Canonical **8 moves**, `assembleQuestSeed`, lock compatibility, template rendering (`{actor}`, `{state}`, `{object}`, …).
- **Status:** Spec-driven; narrative API and tests depend on it.

### B. Emotional Alchemy move engine (quest grammar / wuxing)

- **Path:** `src/lib/quest-grammar/move-engine.ts`, `resolveMoveForContext.ts`, `lens-moves.ts`, `move-assignment.ts`
- **Role:** **15** element-cycle moves (Transcend / Generative / Control), energy deltas, **primaryWaveStage** as `wakeUp | cleanUp | growUp | showUp` (camelCase).
- **Status:** **Different ontology** from registry move_ids; used for **compiled quests**, choice privileging, unpack — not interchangeable with `observe` / `name` without an explicit mapping layer.

### C. Archetype Influence Overlay (playbook → QuestSeed)

- **Path:** `src/lib/archetype-influence-overlay/` (`profiles.ts`, `overlay.ts`)
- **Role:** Post-processes **assembled** `QuestSeed` (prompt intensities / modifiers) for playbook slugs.

### D. Orientation quest — face context index

- **Path:** `src/lib/orientation-quest/face-context-index.ts`
- **Role:** GM **faces** ↔ `TransformationMove` **field slots** and semantic intent; uses registry types explicitly.

### E. Nation move profiles (documentation)

- **Path:** `docs/architecture/nation-move-profiles.md`
- **Role:** Same **content** as v1 `nation-profiles.ts` (nation id, channel, emphasis, flavors). Risk: **two edits** for one design change unless unified.

### F. Monorepo duplicate: `@bars-engine/core`

- **Path:** `packages/bars-core/src/transformation-moves/`
- **Role:** Copy of registry + services for extraction; **root `src/` app does not import `@bars-engine/core`** today (grep: no consumers in `src/`).
- **Risk:** Drift from `src/lib/transformation-move-registry/` if both are edited manually.

## 3. Overlap assessment (EE v1 vs existing)

| EE module | Overlaps with | Issue |
|-----------|---------------|--------|
| `core-moves.ts` | Registry `registry.ts` | **Redundant narrative**; anchors are documentation / teaching aids only — OK if clearly labeled “not a second catalog” |
| `nation-profiles.ts` | `nation-move-profiles.md` | **Duplicate structured data** |
| `archetype-profiles.ts` | `archetype-influence-overlay/profiles.ts` | **Two profile models** (move selection prefs vs overlay intensities); same 8 playbooks, different fields |
| `selectMoves.ts` | `moves.ts` (pre-library) | **Evolution**, not parallel system — good |
| WCGS wording | `move-engine` stages | Naming: `wake_up` vs `wakeUp` — only a **convention** issue unless you build a bridge |

## 4. Recommended integration phases

**Status (implemented):** Phases 0–5 shipped as below. Re-run `npm run verify:transformation-registry-lockstep` after editing registry files.

### Phase 0 — Document the decision tree (low risk) — [x]

- Added decision table + rules to `docs/architecture/narrative-transformation-engine.md`.

### Phase 1 — Single source for canonical 8 moves — [x]

1. **`src/lib/transformation-move-registry`** remains the app runtime source of truth.
2. **`packages/bars-core/src/transformation-moves`** — `services.ts` synced with app (imports use `../archetype-overlay`); `registry.ts` / `types.ts` were already identical.
3. **`npm run verify:transformation-registry-lockstep`** (part of `verify:build-reliability` / `npm run check`) asserts lockstep (multiline imports stripped for `services.ts` compare).

### Phase 2 — Nation profiles: one authorable source — [x]

1. **`src/lib/narrative-transformation/moves/nation-profiles.ts`** is the structured source.
2. **`docs/architecture/nation-move-profiles.md`** reduced to narrative + link + small reference table (no duplicate field tables).

### Phase 3 — Archetype: merge profiles or link explicitly — [x]

- **Option A:** `archetype-profiles.ts` imports **`ARCHETYPE_PROFILES`**, merges with **`SELECTION_BIAS`** (per `archetype_id`), derives **`move_style`** from overlay agency + quest modifiers. Single roster; selection bias table must stay in sync when adding playbooks.

### Phase 4 — Optional bridge: wuxing ↔ registry — [x]

1. **`docs/architecture/wuxing-to-registry-mapping.md`** — stage naming + heuristic “illustrative” registry id by `primaryWaveStage` (copy/teaching only).

### Phase 5 — Call-site audit — [x]

1. **`QuestSeedContext.nationLibraryId`** in `quest-seed-composer.ts` — resolved from `Player.nation.element` → `ELEMENT_TO_NATION`, else `avatarConfig.nationKey`. Callers (e.g. charge flow) can pass this into `buildQuestSeedFromParsed` as `nationId` when wiring narrative seeds.
2. **Growth scenes** already accept `nationSlug` in `GenerateSceneOpts` — no change required for registry path.

## 5. What *not* to do (yet)

- **Do not** fold `move-engine`’s 15 moves into the transformation registry without a spec (EF/EG may own that design).
- **Do not** archive **EE** in backlog until Phase 1–3 are either done or explicitly deferred in `tasks.md` (avoid “done” with known duplication).
- **Do not** duplicate national archetype content from **starter deck templates** (`deck-templates/starters/`) into nation profiles without checking nation/archetype IDs match DB/playbook keys.

## 6. Suggested next commit message (when integrating)

`chore(transformation): align EE nation/archetype data with registry + overlay; add registry drift guard for bars-core`

---

*Created from git history scan (~7 days) + static codebase comparison. Update this file when phases complete.*

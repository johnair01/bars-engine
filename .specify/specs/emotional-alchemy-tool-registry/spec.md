# Spec: Emotional Alchemy Tool Registry

## Purpose

One typed, version-controlled registry of the eleven Emotional Alchemy tools (T01–T11) carrying everything the future recommendation composer needs: WAVE/move-role/channel ratings, protocols, timeboxes, outputs, hard guards, blocker-shape bonus keys, deterministic Show Up templates, operational checks, and mappings that reconcile the three existing tool registries (`technique-library/canonical.ts`, `emotional-first-aid.ts`, taxonomy).

**Problem**: Practice Atlas gap **G4** — three divergent tool registries under different names means three vocabularies in the UI the day they're wired together, and no single source the composer (Atlas §10 target 3) can select from.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. This target is a pure TypeScript library: no persistence, no UI, no AI.

**Canon sources** (the registry transcribes, never invents): [`docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md`](../../../docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md) v1.1 (tools T01–T11, compact matrices 1–4), [`docs/MTGOA_PRACTICE_ATLAS.md`](../../../docs/MTGOA_PRACTICE_ATLAS.md) v3 (§4 hard guards, §4.1 shape map, §5.2 Show Up templates, §5.3 spirit steps, §5.4 operational checks).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Location | `src/lib/emotional-alchemy/` — new module; does not modify `technique-library` or `emotional-first-aid` (reconciliation is by reference via `mappings`, not by rewrite) |
| Channel naming | Registry uses **emotion-named** channels (`anger`/`sadness`/`fear`/`joy`/`neutrality`) per the taxonomy; a `EMOTION_TO_ELEMENT` map bridges to the codebase's element `Channel` (`fire`/`water`/…), with a no-drift test against `CAPABILITIES` in `move-library.ts` |
| Ratings fidelity | `waveRatings` / `moveRoleRatings` / `channelRatings` transcribe the taxonomy compact matrices verbatim; a drift test embeds the matrices and fails on divergence — editing a rating requires editing the taxonomy doc AND the test (deliberate friction, per Atlas §4.1: "a change that breaks a fixture is a canon change") |
| Guards as data | Hard guards (Atlas §4) live in a `HARD_GUARDS` const with stable ids; tools reference guards by id. Enforcement is the composer's job (target 3) — the registry only declares |
| Show Up templates | Deterministic strings with `[slot]` placeholders per Atlas §5.2; slot names match the tool's `outputFields` plus `recipient`/`date`/`time` — a test asserts every non-player slot resolves to an output field |
| Spirit steps | The five generic §5.3 fill-in-the-blank steps ship as `SPIRIT_STEPS`; per-tool spirit notes are carried as prose (`spiritNotes`) for future authoring, not rendered (Atlas G9) |
| Reconciliation | `mappings: { techniqueIds, firstAidKeys }` point at existing registries; tests assert every referenced id exists, so the mapping table from the taxonomy is machine-checked from day one |
| No schema change | Pure TS constants; Prisma section N/A |

## Conceptual Model

- **WHAT**: the tool layer of Emotional Alchemy — the methods players use to perform WAVE submoves (personal throughput: Wake → Open → Clean → Grow → Show).
- **WHO/WHERE**: tools are identity- and domain-agnostic; cards (WHERE = allyship domains) select tools via the composer, not vice versa.
- **Energy**: each tool declares the inspectable output that proves a charge became an artifact (BAR-loggable output, Matrix 4).

## API Contracts (API-First)

Pure module exports (no route, no server action):

```ts
// src/lib/emotional-alchemy/types.ts
export type ToolRating = 'strong' | 'medium' | 'weak' | 'not_recommended'
export type MoveRole = 'metabolize' | 'translate' | 'transcend'
export type EmotionChannel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'
export type SatisfactionSpirit = 'peace' | 'triumph' | 'poignance' | 'bliss' | 'wonder'
export type WaveLens = BasicMove // reuse 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'
export type BlockerShape =
  | 'interpersonal_live' | 'imagined_other' | 'two_voices' | 'belief_sentence'
  | 'many_items' | 'win_wont_land' | 'practice_edge' | 'unclear_heavy_body' | 'ready_to_act'

export interface EmotionalAlchemyTool {
  id: string; slug: string; genericName: string; barsName: string
  lineage: string; coreMechanic: string
  waveRatings: Record<WaveLens, ToolRating>
  moveRoleRatings: Record<MoveRole, ToolRating>
  channelRatings: Record<EmotionChannel, ToolRating>
  misuse: string
  protocol: { steps: string[]; miniSteps?: string[] }
  timebox: { minMinutes: number; maxMinutes: number; quickMinutes?: number }
  outputKind: string; outputFields: string[]
  barReflection: string
  completionCriteria: string[]; whenNotToUse: string[]
  preferAnotherToolWhen: { condition: string; toolId: string }[]
  spiritNotes: Record<SatisfactionSpirit, string>
  showUpTemplates: { internal: string; external: string }
  hardGuardIds: string[]
  shapeBonusKeys: BlockerShape[]
  operationalChecks: { criterion: string; check: string }[]
  mappings: { techniqueIds: string[]; firstAidKeys: string[]; note?: string }
}

// src/lib/emotional-alchemy/index.ts
export const EMOTIONAL_ALCHEMY_TOOLS: EmotionalAlchemyTool[]      // T01..T11, ordered
export const HARD_GUARDS: Record<HardGuardId, { id; rule }>
export const SPIRIT_STEPS: Record<SatisfactionSpirit, string>
export const EMOTION_TO_ELEMENT: Record<EmotionChannel, Channel>  // anger→fire, …
export function getToolById(id: string): EmotionalAlchemyTool | undefined
export function getToolBySlug(slug: string): EmotionalAlchemyTool | undefined
export function toolsForSubmove(lens: WaveLens, min?: ToolRating): EmotionalAlchemyTool[]
export function toolsForChannel(channel: EmotionChannel, min?: ToolRating): EmotionalAlchemyTool[]
export function toolForShape(shape: BlockerShape): EmotionalAlchemyTool[]
export function ratingAtLeast(rating: ToolRating, min: ToolRating): boolean
```

## User Stories

### P1: One selectable tool pool
**As** the future composer (Atlas target 3), **I want** every tool's ratings, guards, shape keys, and templates behind one typed accessor, **so** `recommendPractice` can be a pure function over registry data.
**Acceptance**: `toolsForSubmove('clean_up', 'strong')` returns exactly T01, T02, T04 (taxonomy Matrix 1); `getToolById('T09')!.hardGuardIds` includes the joy-tool block.

### P2: Registries reconciled, not duplicated
**As a** maintainer, **I want** the taxonomy↔technique-library↔EFA mapping machine-checked, **so** renames or deletions in either registry fail tests instead of silently diverging.
**Acceptance**: every `mappings.techniqueIds` entry exists in `CANONICAL_TECHNIQUES`; every `mappings.firstAidKeys` entry exists in `DEFAULT_FIRST_AID_TOOLS`.

### P3: Canon drift is loud
**As a** designer, **I want** rating changes to require touching the doc and the test, **so** matrix edits are deliberate canon changes.
**Acceptance**: the test suite embeds compact matrices 1–3 and fails on any divergence from registry data.

## Functional Requirements

### Phase 1 (single phase)

- **FR1**: `types.ts` defines the contract above, reusing `BasicMove` from `technique-library/vocabulary` and element `Channel` for the bridge map.
- **FR2**: `registry.ts` seeds T01–T11 with all fields transcribed from taxonomy v1.1 (items 1–18 per tool) and Atlas v3 §4/§4.1/§5.2/§5.4 (guards, shape keys, templates, checks).
- **FR3**: `index.ts` exports the constants and accessors; accessors are pure and allocation-light.
- **FR4**: `HARD_GUARDS` carries the seven Atlas §4 guards with stable ids (`hot_charge`, `joy_tool_block`, `grief_inquiry_block`, `no_gamified_risk`, `action_on_grief_block`, `clean_line_readiness`, `external_gate`).
- **FR5**: Tests cover: 11 unique ids/slugs; matrix drift (Matrices 1–3); structural completeness (non-empty protocol/outputs/criteria; timebox sanity); guard assignments (T09+T11 joy block, T04 grief block, T11 risk block, T07 in no tool's guard list); template slot resolution; mapping existence; `EMOTION_TO_ELEMENT` no-drift vs `CAPABILITIES`; shape map covers all nine shapes and matches Atlas §4.1.
- **FR6**: The new test file is added to `vitest.config.ts` include list.

## Non-Functional Requirements

- No runtime dependencies beyond existing project imports; tree-shakeable named exports.
- Does not alter `technique-library` or `emotional-first-aid` behavior (additive only).
- `npm run check` and the vitest suite pass.

## Persisted data & Prisma

N/A — pure TypeScript constants, no schema change.

## Verification Quest

N/A — no UX surface. The composer spec (Atlas §10 target 3) carries the player-facing Verification Quest; this registry is its dependency.

## Dependencies

- `docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md` (v1.1 — canon source)
- `docs/MTGOA_PRACTICE_ATLAS.md` (v3 — guards, shapes, templates)
- `src/lib/technique-library/` (vocabulary reuse + mapping targets)
- `src/lib/emotional-first-aid.ts` (mapping targets)

## References

- `src/lib/allyship-deck/move-library.ts` (`CAPABILITIES` — channel bridge no-drift source)
- `docs/MTGOA_PRACTICE_ATLAS_GAP_ANALYSIS.md` (G4 rationale)
- fail-fix-workflow: `npm run check`, vitest

# Plan: Emotional Alchemy Tool Registry

## Strategy

Additive library module. Transcribe canon (taxonomy v1.1 + Atlas v3) into typed constants; machine-check fidelity with drift tests rather than trusting future edits. No existing module is modified except `vitest.config.ts` (test include).

## File impacts

| File | Action | Content |
|---|---|---|
| `src/lib/emotional-alchemy/types.ts` | create | Contract types (spec § API Contracts); reuses `BasicMove`, element `Channel` |
| `src/lib/emotional-alchemy/registry.ts` | create | `EMOTIONAL_ALCHEMY_TOOLS` (T01–T11), `HARD_GUARDS`, `SPIRIT_STEPS`, `EMOTION_TO_ELEMENT` |
| `src/lib/emotional-alchemy/index.ts` | create | Re-exports + accessors (`getToolById`, `toolsForSubmove`, `toolsForChannel`, `toolForShape`, `ratingAtLeast`) |
| `src/lib/emotional-alchemy/__tests__/registry.test.ts` | create | Drift, structure, guard, template-slot, mapping, shape-map tests |
| `vitest.config.ts` | edit | Add the test file to `include` |

## Key implementation notes

- Rating order for `ratingAtLeast`: `not_recommended < weak < medium < strong`.
- Template slot convention: `[slot]` where slot ∈ tool `outputFields` ∪ {`recipient`, `date`, `time`, and tool-local player inputs documented per template}. Test extracts slots by regex and asserts resolution.
- `EMOTION_TO_ELEMENT` is asserted against `CAPABILITIES` (`move-library.ts`): the capability whose `channelLabel`/`dissatisfied` corresponds to each emotion must carry the mapped element key.
- T11 exists only in taxonomy v1.1 (addendum) — ratings come from the amended compact matrices (Sadness = `not_recommended`).

## Risks

- Transcription errors → mitigated by the embedded-matrix drift tests (they force a second, independent transcription).
- `npm run check` runs `db:generate`; requires Prisma engines present in the environment (no schema change, generation only).

## Out of scope

Composer/selection logic (target 3), diagnostic flow (target 2), any UI, any persistence, edits to `technique-library`/`emotional-first-aid` data.

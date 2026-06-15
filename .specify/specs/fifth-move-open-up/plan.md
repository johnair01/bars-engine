# Plan: Fifth Move — "Open Up"

> Implement per [spec.md](./spec.md). Type-first: change the unions, then fix every exhaustiveness error the compiler surfaces. Ontology + grammar only; UI and Nation schema deferred.

## Strategy

Adding `'openUp'` to `PersonalMoveType` (and `'Open'` to `WaveStage`) turns the TypeScript compiler into the worklist: every exhaustive `Record<PersonalMoveType, …>` and `PersonalMoveType[]` will error until updated. We update the known maps proactively (FR4–FR7), then run `npm run check` and resolve any remaining exhaustiveness errors. The ~1300 string references to move identifiers are NOT exhaustive checks and are unaffected.

```
Phase 1  Docs            conceptual-model.md, FOUNDATIONS.md
Phase 2  Type unions     types.ts: WaveStage +Open, PersonalMoveType +openUp
Phase 3  Lockstep maps   WAVE_NAMES, WAVE_LABELS, ALL_WAVE_MOVES, VALID_STAGES,
                         WAVE_TO_DOMAIN, z.enum parity, test arrays
Phase 4  Verify          npm run check; resolve residual exhaustiveness errors
```

## File Impacts

### Docs
- `.specify/memory/conceptual-model.md` — 4→5 moves, WAVE order, independence note
- `FOUNDATIONS.md` — move list / WAVE references
- `ARCHITECTURE.md` — only if it enumerates the four moves

### Grammar types (lockstep)
- `src/lib/quest-grammar/types.ts` — `WaveStage`, `PersonalMoveType` unions (ordered per WAVE)
- `src/lib/quest-grammar/choice-privileging-context.ts` — `WAVE_NAMES`
- `src/lib/quest-grammar/compileQuestCore.ts` — `WAVE_LABELS`, `ALL_WAVE_MOVES`
- `src/lib/quest-grammar/archetype-wave.ts` — `VALID_STAGES`
- `src/lib/quest-grammar/canonical-kernel.ts` — `WAVE_TO_DOMAIN`
- `src/lib/cyoa-intake/spoke-generator.ts`, `src/lib/cyoa-intake/*` — `z.enum` parity
- `src/lib/daoe/__tests__/battery-6face.ts` — test stage array parity

### Unaffected (verify, don't refactor)
- `move-engine.ts` 15-move table — `primaryWaveStage` values stay; `'openUp'` becomes an allowed value but no existing entry is remapped.
- `Nation` schema, move UIs, `moveType` data — deferred.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Hidden exhaustive `switch`/`satisfies` on the unions beyond the known maps | Let `npm run check` surface them; fix each (add `openUp`/`Open` case). |
| Ordering assumptions (code that indexes the move array positionally) | Insert Open Up in WAVE order; grep for `[0]`..`[3]` indexing on move arrays before finalizing. |
| Quest-gen skew from `openUp → 'Raise Awareness'` sharing a domain with `wakeUp` | Acceptable for this slice; flagged as an open question for the Nation rollout. |
| Scope creep into the 1300 UI refs | Hard stop at grammar + docs; out-of-scope list in spec. |

## Verification

- `npm run check` — 0 type errors (exhaustiveness satisfied).
- Spot-check: `getArchetypePrimaryWave`, `compileQuestCore` move-selection, choice-privileging still type-check and run.
- No Prisma/migration changes.

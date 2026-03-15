# Tasks: Emotional Vector Canonization

## Phase 1: Types

- [x] **1.1** Add `MoveFamily` and `EmotionalVector` to `src/lib/quest-grammar/types.ts`
- [x] **1.2** Add `getMoveFamily(move: CanonicalMove): MoveFamily` to `src/lib/quest-grammar/move-engine.ts`
- [x] **1.3** `moveFamily` kept as function only (`getMoveFamily`) — wiki already uses it
- [x] **1.4** `npm run build` and `npm run check` passing

## Phase 2: Docs

- [x] **2.1** `.specify/memory/conceptual-model.md` — Transcend vs Translate paragraph updated
- [x] **2.2** `.agent/context/emotional-alchemy-ontology.md` — Transcend vs Translate section present; vector format documented
- [x] **2.3** `src/app/wiki/emotional-alchemy/page.tsx` — Transcend vs Translate section present; move table shows Family column via `getMoveFamily`

## Phase 3: Wuxing Scene Routing Extension (from ooo run — AES)

- [x] **3.1** `src/lib/alchemy/wuxing.ts` — shēng (生) and kè (克) cycles; `resolveMoveDestination`; `SceneType = 'transcend' | 'generate' | 'control'`
- [x] **3.2** Wiki page: Enrich Transcend vs Translate section with three scene families + Wuxing cycles
- [x] **3.3** `src/lib/growth-scene/types.ts` — `SceneDsl` carries `sceneType` and `targetChannel`

## Verification

- [x] `npm run build` passes
- [x] `npm run check` passes
- [x] Wiki page `/wiki/emotional-alchemy` renders; Transcend vs Translate visible with scene families

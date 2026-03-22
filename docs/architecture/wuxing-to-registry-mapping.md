# Wuxing (Emotional Alchemy) ↔ Transformation Registry — Mapping

## Why this document exists

The codebase has **two move systems** with **different IDs**:

| System | Location | Role |
|--------|----------|------|
| **Emotional Alchemy / wuxing** | `src/lib/quest-grammar/move-engine.ts` | 15 canonical moves (`metal_transcend`, `wood_fire`, …); **energy** and **element cycle**; used in **quest compilation**, choice privileging, unpack. |
| **Transformation move registry** | `src/lib/transformation-move-registry/` | 8 moves (`observe`, `name`, `externalize`, …); **WCGS narrative arc**; used in **narrative → QuestSeed**, BAR/charge paths that need **wake / clean / grow / show** prompts. |

They are **not** interchangeable without translation. This table is for **product copy, UX alignment, and teaching** — not to overwrite `move_id` in stored seeds.

## WCGS stage naming

| Quest grammar (`PersonalMoveType`) | Registry (`WcgsStage`) |
|-----------------------------------|-------------------------|
| `wakeUp` | `wake_up` |
| `cleanUp` | `clean_up` |
| `growUp` | `grow_up` |
| `showUp` | `show_up` |

## Optional “default registry flavor” by primary wave stage

When UI needs a **single registry prompt family** to illustrate a wuxing move’s **primaryWaveStage** (teaching only):

| `primaryWaveStage` (move-engine) | Illustrative registry `move_id` | Note |
|-----------------------------------|----------------------------------|------|
| `wakeUp` | `observe` | Awareness / pattern surface |
| `cleanUp` | `externalize` | Shadow / dialogue distance |
| `growUp` | `reframe` | Meaning shift |
| `showUp` | `experiment` | Small behavioral test |

This is **heuristic**: many wuxing moves share the same `primaryWaveStage`; registry selection in production uses **locks, nation, archetype** (`selectDefaultMoveIds`).

## Do not

- Store wuxing IDs (`wood_fire`, …) in `QuestSeed.arc.*.move_id` — those slots expect **registry** IDs.
- Merge the catalogs in code without a spec that defines **bidirectional** mapping and **migration** of stored data.

## See also

- [narrative-transformation-engine.md](./narrative-transformation-engine.md) — when to use which pipeline
- [nation-move-profiles.md](./nation-move-profiles.md) — nation bias on **registry** selection

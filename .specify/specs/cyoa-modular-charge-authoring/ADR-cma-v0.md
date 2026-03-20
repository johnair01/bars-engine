# ADR: CYOA Modular Authoring (CMA) — v0 IR & validation

**Status:** Accepted (Phase 1)  
**Date:** 2026-03-20  
**Spec:** [spec.md](./spec.md) · **Strand:** [STRAND_OUTPUT.md](./STRAND_OUTPUT.md)

## Context

Modular CYOA (“Lego-robotics” UX) needs a **product-owned** graph model before palette UI: typed nodes, explicit edges, validation before AI fill or Twee export. This ADR defines **v0 IR**, pipeline order, mapping to Twine patterns, and integration with existing BARS packages.

## Decision

### 1. Node archetypes v0 (7)

| Kind (machine) | Human label | Role |
|----------------|-------------|------|
| `scene` | Scene | Exposition / beat(s); linear continuation |
| `choice` | Choice | Player-facing branch; **≥ 2** outgoing edges |
| `metabolize` | Metabolize | Reflect / name tension (copy slot) |
| `commit` | Commit | Irreversible story beat |
| `branch_guard` | BranchGuard | Predicate on domain/lens/tag (v0: compile-time tags only) |
| `merge` | Merge | Convergence from branches |
| `end` | End | Completion / handoff; must be **reachable** from start |

MVP may use a **subset** in UI (e.g. scene + choice + end) while valid IR accepts all seven.

### 2. IR sketch (`CmaStory`)

```ts
// Implemented in src/lib/modular-cyoa-graph/types.ts

interface CmaEdge {
  id: string
  from: string  // node id
  to: string
  label?: string  // choice text arm
}

interface CmaFragment {
  id: string           // stable id for <<include>>-like expansion
  title?: string
  nodes: CmaNode[]
  edges: CmaEdge[]
  entryNodeId: string  // subgraph entry when inlined
}

interface CmaNode {
  id: string
  kind: CmaNodeKind
  title?: string
  /** Optional payload (placeholders, guard tags, etc.) */
  metadata?: Record<string, unknown>
}

interface CmaStory {
  id?: string
  startId: string
  nodes: CmaNode[]
  edges: CmaEdge[]
  fragments?: CmaFragment[]
}
```

- **Compilation** (future): expand `fragmentRef` on nodes (not in v0 types yet) → inline or Twee `<<include>>`.
- **Campaign-scoped ids** recommended for passage names on export to avoid collisions.

### 3. Validation pipeline order

1. **Ingest** — Parse JSON → `CmaStory`.
2. **Structural** — `validateQuestGraph(story)` (see below): ids, edges, ends, choice arms, reachability.
3. **Slot fill** — Optional AI / templates populate `scene` / `metabolize` body fields (future: separate `CmaNodeBody` store).
4. **Lint** — Orphans, dead arms (extended rules later).
5. **Serialize Twee** — Compiler: `CmaStory` → `cmaStoryToIrNodes` → [`irToTwee`](../../src/lib/twine-authoring-ir/irToTwee.ts) (canonical). Direct Twee emit without IR is deprecated.
6. **Simulate** — Optional: [flow-simulator-cli](../flow-simulator-cli/spec.md) or golden-path walk.

### 4. Twine mapping (conceptual)

| Twine / SugarCube | CMA IR |
|-------------------|--------|
| Passage | `scene` / `metabolize` / … (per-node Twee name = f(campaign, node.id)) |
| `[[label->Target]]` | `choice` → multiple `CmaEdge` with `label` |
| `<<include "Passage">>` | `fragmentRef` + `CmaFragment` (compile expands) |
| `<<widget name args>>` | Parameterized **macro** expansion (Phase 2+); store in `metadata.macro` |

### 5. Integration points

| Package / spec | Relationship |
|----------------|--------------|
| [twine-authoring-ir](../twine-authoring-ir/spec.md) | **Shared direction:** both use IR → Twee. Twine IR v0 types (`passage`, `choice_node`, `informational`) are **narrower**. **Mapper** Phase 2: subset of `CmaStory` ↔ `IRNode[]` for mobile admin reuse, or direct Cma → Twee compiler. |
| [quest-grammar-compiler](../quest-grammar-compiler/spec.md) | Generated **quest packets** remain source of **slot text**; CMA graph may **wrap** or **replace** topology authoring over time. |
| [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md) | Skeleton-first + feedback stays **authoring UX**; CMA validator runs **before** “fill with AI” where we wire it. |
| `validateQuestGraph` | **New:** `src/lib/modular-cyoa-graph/validateQuestGraph.ts` — canonical **grammar check** for palette MVP. |
| [flow-simulator-cli](../flow-simulator-cli/spec.md) | **Later:** behavioural sim; v0 uses structural validation only. |

### 6. Falsification tests (CI)

| Code | Rule |
|------|------|
| `NO_END` | At least one `kind === 'end'` node. |
| `UNREACHABLE_END` | Every `end` node reachable from `startId` via `edges`. |
| `CHOICE_SINGLE_ARM` | Every `choice` node has **≥ 2** outgoing edges. |

Additional structural checks: unknown `startId`, dangling `edges`, duplicate node ids.

## Consequences

- **Positive:** Clear gate for Phase 2 UI; tests without DB; aligns with strand consult.
- **Negative:** Second IR family beside `twine-authoring-ir` until a **mapper** lands — accept duplication short-term; document merge in Phase 2 ADR update.
- **Deferred:** Ink knots, runtime stateful guards, full fragment inlining — see [STRAND_OUTPUT.md](./STRAND_OUTPUT.md) Sage section.

## References

- [CYOA_MODULAR_AUTHORING_RESEARCH.md](../../docs/CYOA_MODULAR_AUTHORING_RESEARCH.md)
- Twine Cookbook — SugarCube modularity: <https://twinery.org/cookbook/modularity/sugarcube/sugarcube_modularity.html>

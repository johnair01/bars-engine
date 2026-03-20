# Spec: CYOA Modular Charge Authoring (Lego-Robotics UX)

## Purpose

Codify research and product intent for **modular, grammatical CYOA** so generated adventures are **composable** (not clunky one-shot prose): authors and players assemble stories from **charge metabolization** using UX analogous to **learning Lego robotics** — progressive disclosure, typed blocks, short test loops, reusable sub-assemblies.

**Source research:** [docs/CYOA_MODULAR_AUTHORING_RESEARCH.md](../../../docs/CYOA_MODULAR_AUTHORING_RESEARCH.md)

**Problem:** CYOA adventures built with Twine/Twee and AI are included in the game, but authoring and generation lack a **stable modular mental model**; topology and copy collapse together; non-experts cannot reliably “program” their metabolization.

**Practice:** Deftness Development — spec kit first; **strand consult** (six Game Master faces) refines scope before heavy implementation. See [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| North-star UX | **Lego robotics**: palette of typed blocks, snap constraints, run/preview, localized debug — not freeform Twee for primary author. |
| Charge → story | **Charge metabolization** supplies **typed inputs** to a **limited block library** (wake/cleanup/grow/show beats, lens, domain, etc.); compiler **grounds** to Twee/Twine export. |
| Grammar vs AI | AI fills **content inside node types** and suggests **topology**; **grammar** (legal node/edge types) is **product-owned** and validated. |
| Twine compatibility | **Export** remains Twee/Twine-friendly; **internal IR** may adopt **Ink-like** module concepts (knot/stitch) if composition improves. |
| Strand consult | Before Phase 2+ build, run **strand: consult** with all six faces using [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md); Sage integrates outputs into spec/tasks deltas. |
| Non-destructive to DJ | Extends [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md) (skeleton-first, I Ching, feedback); does not replace it. |
| Strand consult outcome (2026-03-20) | First pass recorded in [STRAND_OUTPUT.md](./STRAND_OUTPUT.md): **7 node archetypes v0** (Scene, Choice, Metabolize, Commit, BranchGuard, Merge, End); **IR → validate → fill → Twee** pipeline; **3 falsification tests**; **admin-only MVP** before player palette; AI = **opt-in fill** after valid graph; **defer** Ink knots, full visual scripting, player palette until export round-trip proven. Optional `sage_consult` re-run when bars-agents MCP available. |

---

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player-author metabolizing charge; Campaign Owner; admin |
| **WHAT** | Modular story = **graph of typed passages** + **template subgraphs** + **guarded edges** |
| **WHERE** | Quest grammar UI, future player-facing “my blocks”; export to Adventures |
| **Energy** | Charge → BAR → **block palette** selection → preview → publish |
| **Personal throughput** | Same loop as Lego: **build → run → fix one block** |

---

## User Stories

### P1: Block palette (v0)

**As a** player-author, **I want** a small set of labeled story blocks (choice, metabolize, commit, branch-on-domain), **so that** I can assemble a story without writing Twee.

**Acceptance:** Palette exists; blocks have **visible types**; illegal snaps rejected with a clear message.

### P2: My library from past metabolization

**As a** player-author, **I want** to save accepted subgraphs from prior quests/BARs, **so that** I reuse my own patterns.

**Acceptance:** User or campaign-scoped library; insert = **include/widget**-like behavior at IR level.

### P3: Skeleton before flavor

**As an** author, **I want** structure (nodes, edges) locked before prose generation, **so that** I don’t chase malformed graphs.

**Acceptance:** Matches DJ Phase 2 behavior for admin; path defined for player-simplified flow.

### P4: Validate and simulate

**As an** author, **I want** one-click **simulate** or validate reachable completion, **so that** I trust publish.

**Acceptance:** Hook to [flow-simulator-cli](../flow-simulator-cli/spec.md) or equivalent validator; failures surface as **roadblock** hints.

---

## Functional Requirements

### Phase 0: Spec + strand consult (this kit)

- **FR0.1**: Six-face strand brief documented; runnable as `strand: consult` input. **Done** in [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md).
- **FR0.2**: Research doc linked; backlog + prompt aligned.

### Phase 1: Vision alignment (post-consult)

- **FR1.1**: ADR or short architecture note: **internal IR** vs Twee export, block taxonomy v0.
- **FR1.2**: Integration points with [twine-authoring-ir](../twine-authoring-ir/spec.md), [quest-grammar-compiler](../quest-grammar-compiler/spec.md).

### Phase 2: Block palette MVP (implementation — future tasks)

- **FR2.1**: Define **node archetypes** (min set) and **validation rules** (reachable end, no orphan choice arms).
- **FR2.2**: UI: palette + graph or linear review (admin first, optional player later).
- **FR2.3**: Compiler path: blocks → IR → Twee export.

### Phase 3: Library + charge bridge

- **FR3.1**: Persist **template subgraphs** with provenance (BAR id, quest id).
- **FR3.2**: Map **charge capture fields** → suggested blocks (non-mandatory suggestions).

### Phase 4: Pedagogy & gating

- **FR4.1**: Progressive **unlock** of block types (deftness-appropriate); tutorial copy.
- **FR4.2**: Dual-track: full path with AI, constrained path without.

---

## Non-Functional Requirements

- **NFR1**: Dual-track — degrade gracefully without LLM (structure-only or templates).
- **NFR2**: Community-facing language respects **non-AI-first** stance ([CLAUDE.md](../../../CLAUDE.md)); blocks are “skills,” not “prompt tricks.”
- **NFR3**: Cross-platform; no new native deps for palette MVP.

---

## Strand: Consult (six faces)

**Do not skip:** When kicking off Phase 1–2 implementation, run a strand investigation that includes **all six faces**. Each face addresses a different failure mode of modular CYOA + AI.

| Face | Role in this spec | bars-agents / tool hint |
|------|-------------------|-------------------------|
| Shaman | Charge, liminal UX, unnamed friction | `shaman_read`, `shaman_identify` |
| Regent | Phasing, gates, definition of done | `regent_assess` |
| Challenger | Stress-test assumptions, anti-patterns | `challenger_propose` |
| Architect | IR, compile, modular patterns (Twine/Ink) | `architect_draft`, `architect_compile` |
| Diplomat | Onboarding, relational copy, who is excluded | `diplomat_guide`, `diplomat_bridge` |
| Sage | Integration, conflicts, backlog order | `sage_consult` |

**Concrete brief for strand runner:** Copy sections from [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md) into the strand subject/context so each sect has **questions + output shape**.

---

## Dependencies

- [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md)
- [twine-authoring-ir](../twine-authoring-ir/spec.md)
- [quest-grammar-compiler](../quest-grammar-compiler/spec.md)
- [strand-system-bars](../strand-system-bars/spec.md) — orchestration for consult
- [docs/CYOA_MODULAR_AUTHORING_RESEARCH.md](../../../docs/CYOA_MODULAR_AUTHORING_RESEARCH.md)

---

## References

- Twine Cookbook — SugarCube modularity: <https://twinery.org/cookbook/modularity/sugarcube/sugarcube_modularity.html>
- Ink: <https://github.com/inkle/ink>

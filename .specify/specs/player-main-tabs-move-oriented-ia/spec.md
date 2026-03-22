# Spec: Player Main Tabs — Move-Oriented IA (Now / Vault / Play)

## Purpose

Reorganize the **three primary player surfaces** — **Now** (`/`), **Vault** (`/hand` and related possession routes), and **Play** (`/adventures` and active play flows) — so that:

1. Each top-level area is structured around the **four throughput moves** (Wake Up, Clean Up, Grow Up, Show Up) as the primary navigation metaphor.
2. Under each move, **subpages or sections** list **what a player can do** inside that move (concrete verbs: capture, name, externalize, reframe, experiment, integrate, etc.), so the UI reads as **doing and playing**, not browsing static lists.
3. Before implementation, each page receives a **six–Game Master face analysis** mapped to the **game loop** (charge → metabolize → quest/thread/campaign → visible impact), producing a prioritized change list.

This spec is the **contract** for that analysis and the **target information architecture**. Implementation may roll out in phases; nested Vault work overlaps [vault-page-experience](./../vault-page-experience/spec.md) and should stay consistent with it.

## Relationship to Existing Work

| Artifact | Role |
|----------|------|
| [vault-page-experience](../vault-page-experience/spec.md) | Vault caps, compost, nested rooms; already mandates **four moves on each room** |
| [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) | Charge→quest→thread/campaign loop |
| [game-map-gameboard-bridge](../game-map-gameboard-bridge/spec.md) | Four slots by move; shared metaphor with map/gameboard |
| [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) | Dashboard IA, throughput framing |

**Non-goals for v0 of this spec:** Replacing transformation registry semantics; changing WCGS definitions; conflating **archetype playbooks** or **allyship superpowers** with the four moves (moves are developmental throughput; archetypes/nations flavor expression elsewhere).

---

## Six Game Master Faces — Analysis Deliverable

For each main tab (**Now**, **Vault**, **Play**), produce a structured brief using the **six Game Master faces** (see project rules: shaman, regent, challenger, architect, diplomat, sage). Each face answers how that page **serves the game loop** and what **gaps or distortions** exist today.

| Face | Analysis question (per page) |
|------|------------------------------|
| **Shaman** | What is *actually happening* emotionally / narratively on this surface? What signals does the player receive from the “felt field”? |
| **Regent** | What are the rules, limits, and clarity of next actions? Where is sovereignty unclear (caps, permissions, state)? |
| **Challenger** | What friction, avoidance, or premature comfort does the UI allow? What should be harder or more honest? |
| **Architect** | What is the structural IA (routes, sections, data dependencies)? What must be true for move-based navigation to compose? |
| **Diplomat** | How does this page connect the player to others, campaigns, or shared play — or isolate them appropriately? |
| **Sage** | What is the integration / meta-pattern? How does this tab advance *Clean Up → Grow Up → Show Up* across sessions? |

**Output artifact (required):** `SIX_FACE_ANALYSIS.md` in this spec folder (one section per tab, six subsections per tab, plus a **synthesis** table: gap → proposed move placement → priority).

**Optional tooling:** `sage_consult` (bars-agents MCP) for synthesis only after drafts exist; deterministic checklists suffice for v0.

---

## Target Information Architecture

### Four moves as primary organization

Each of **Now**, **Vault**, and **Play** should expose the **same four move labels** as top-level **regions or tabs** (exact control: pills, vertical rail, or nested routes — TBD in plan):

| Move | Player-facing label | Intent |
|------|---------------------|--------|
| Wake Up | Wake Up | Notice, name, observe — attending to what is |
| Clean Up | Clean Up | Externalize, feel, discharge — clearing distortion |
| Grow Up | Grow Up | Reframe, invert, integrate meaning — developmental shift |
| Show Up | Show Up | Experiment, act in world — commitment and visibility |

**Integrate** (BAR / completion) may appear under **Show Up** or as a **fifth “completion” strip** where the product already treats integration distinctly; decision recorded in `plan.md` to avoid duplicating [transformation-move-registry](../../src/lib/transformation-move-registry/) semantics incorrectly.

### Subpages / affordances per move

Under each move, **subpages** (or deep-linked sections) enumerate **actions the player can take** that belong to that move, e.g.:

- **Wake Up:** open charge capture, review notifications, “what’s alive now,” daemon pings, orientation prompts.
- **Clean Up:** 321 / shadow flows, BAR drafts, compost/salvage (Vault), emotional first aid shortcuts.
- **Grow Up:** quest unpack, reframes, library/deck pulls tied to growth, campaign reflection entry points.
- **Show Up:** active quests, adventures, invitations, placement, “next visible action,” social/campaign commitments.

Exact mapping is **data-driven** from the six-face analysis and existing routes; this spec does not freeze URLs until analysis is done.

### Route map (illustrative — not normative until analysis signs off)

```
/                 → Now (lobby): move quadrants or tabs + dashboard cards filtered by move
/hand             → Vault: already planning nested rooms; align under four moves
/adventures       → Play: list/filter by move; adventure play chrome surfaces “current move” context
```

---

## Functional Requirements

- **FR1:** Deliver `SIX_FACE_ANALYSIS.md` covering Now, Vault, Play with the six-face template and game-loop mapping.
- **FR2:** Produce a **consolidated change list** (P0/P1/P2) tying gaps to **move placement** and **subpage** affordances.
- **FR3:** Update this spec’s `plan.md` with phased implementation order after analysis; `tasks.md` as the execution checklist.
- **FR4:** Now / Vault / Play each expose **four move** primary organization in the target design (prototype or production per phase).
- **FR5:** Each move area lists **player-doable actions** (verbs) scoped to that move; dead ends and “browse-only” lists are flagged in analysis.
- **FR6:** Navigation and copy remain **dual-track** — usable without LLMs; no required AI for core navigation.

## Testing / Verification

- **Analysis:** Peer review of `SIX_FACE_ANALYSIS.md` against live routes in `NavBar` (`/` = Now, `/hand` + related = Vault, `/adventures` = Play).
- **Implementation phases:** When UI ships, add smoke checks: user can reach at least one **do** action per move per tab (or documented exception with Regent rationale).

## Constraints

- Align terminology with wiki and [UI style guide](/wiki/ui-style-guide) where applicable.
- Do not rename **Now / Vault / Play** in nav without explicit follow-up spec (this spec focuses on **internal** organization).
- Preserve mobile touch targets and existing auth-gated patterns.

## References

- [`src/components/NavBar.tsx`](../../../src/components/NavBar.tsx) — NOW / VAULT / PLAY labels and active regions
- [Game Master agents rule](../../../.cursor/rules/game-master-agents.mdc) — six faces, Sage integration
- [Deftness skill](../../../.agents/skills/deftness-development/SKILL.md) — emotional energy as fuel

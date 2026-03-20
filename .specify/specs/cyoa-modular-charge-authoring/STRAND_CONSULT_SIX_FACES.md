# Strand consult: CYOA Modular Charge Authoring — Six Game Master faces

**Use as the structured brief** when running `strand: consult` (or multi-agent investigation) on [.specify/specs/cyoa-modular-charge-authoring/spec.md](./spec.md).

**Goal:** Stress-test and enrich the spec before Phase 1–2 implementation. Each face produces **(1) observations, (2) risks, (3) recommendations** in **≤ 15 bullet lines**. **Sage** merges into a single **integration brief** + **task deltas** for `tasks.md`.

**Suggested strand order:** Shaman → Architect → Challenger → Regent → Diplomat → Sage (Sage last for synthesis).

---

## Shared context (paste into strand subject)

- **North star:** Lego-robotics-style authoring: typed blocks, snap rules, short preview loop, reusable sub-assemblies.
- **Charge metabolization:** User’s emotional/creative charge becomes **typed input** to a **limited palette**; compiler outputs Twee/Twine-compatible adventures.
- **Tension:** Twine flat passage graph vs Ink-like modules; AI prose vs grammar-owned topology; admin tool vs eventual player-facing authoring.
- **Artifacts:** This spec, `plan.md`, `tasks.md`, optional ADR after consult.

---

## 1. Shaman (liminal / charge / terrain)

**Lens *I* — what is moving underneath?**

| Deliver | Ask |
|---------|-----|
| Observations | What **unnamed fears or desires** would block someone from using blocks instead of free writing? |
| Observations | Where does **charge leak** if the UX feels like “filling a form” instead of metabolizing? |
| Risks | Does block vocabulary **medicalize** or **flatten** emotion? |
| Recommendations | What **ritual language** (game language) should labels use (WHO/WHAT/WHERE/Energy/throughput)? |

**Output shape:** `shaman: { observations[], risks[], recommendations[] }`

**bars-agents:** `shaman_read`, `shaman_identify`

---

## 2. Architect (structure / system / compile)

**Lens *It* — what must be true in the machine?**

| Deliver | Ask |
|---------|-----|
| Observations | Minimal **node type set** v0: what are the 5–8 irreducible passage archetypes? |
| Observations | How do `<<include>>` / `<<widget>>` map to our IR ([twine-authoring-ir](../twine-authoring-ir/spec.md))? |
| Risks | **Internal model vs export:** where might Ink-like knots help without breaking Twee? |
| Recommendations | **Validation pipeline:** order of operations (parse → typecheck graph → generate copy → export). |

**Output shape:** `architect: { observations[], risks[], recommendations[], ir_sketch? }`

**bars-agents:** `architect_draft`, `architect_compile`

---

## 3. Challenger (rupture / falsify / edge cases)

**Lens stress — what breaks the story?**

| Deliver | Ask |
|---------|-----|
| Observations | How does **one-shot AI generation** defeat modular UX even if we add a palette later? |
| Risks | **Orphan nodes**, unreachable ends, **choice loops**, state divergence — which does the MVP ignore at its peril? |
| Risks | **Malicious or lazy** block stacking (infinite branches, empty metabolize nodes). |
| Recommendations | **Falsification tests:** three concrete user flows that should **fail fast** with useful errors. |

**Output shape:** `challenger: { observations[], risks[], anti_patterns[], recommendations[] }`

**bars-agents:** `challenger_propose`

---

## 4. Regent (order / phasing / gates)

**Lens *We* institutionalized — what ships when?**

| Deliver | Ask |
|---------|-----|
| Observations | **Phase gates:** what is forbidden until skeleton-first is proven (admin) vs player palette? |
| Observations | Dependencies: DJ, twine-authoring-IR, flow-simulator — **linearize** for staffing. |
| Risks | **Scope creep:** Lego metaphor expands to full visual scripting — draw a line. |
| Recommendations | **Definition of done** for Phase 2 MVP (measurable). |

**Output shape:** `regent: { observations[], risks[], phase_gates[], recommendations[] }`

**bars-agents:** `regent_assess`

---

## 5. Diplomat (relational / onboarding / culture)

**Lens *We* relational — what will communities accept?**

| Deliver | Ask |
|---------|-----|
| Observations | Portland / allyship context: how to frame **AI assistance** as **optional power tool** not identity? |
| Observations | **Onboarding** for first-time block authors: what’s the **2-minute** path? |
| Risks | **Exclusion:** who cannot use block UX (cognitive load, language, motor)? |
| Recommendations | **Copy principles** for errors, palette tooltips, and “Report Issue” alignment with cert quests. |

**Output shape:** `diplomat: { observations[], risks[], copy_principles[], recommendations[] }`

**bars-agents:** `diplomat_guide`, `diplomat_bridge`

---

## 6. Sage (integration / meta / coordination)

**Lens AQAL / whole — what is the smallest coherent whole?**

| Deliver | Ask |
|---------|-----|
| Observations | **Conflicts** between Shaman (warmth) vs Architect (cold types) vs Challenger (rupture) — where is the synthesis? |
| Observations | **Backlog** order: what single increment proves Lego UX without committing to player authoring? |
| Risks | **Strand compost:** how do we avoid consult docs rotting — link outputs to `tasks.md` checkboxes? |
| Recommendations | **Single-page integration brief** + **3 priority tasks** + **1 deferred explicitly**. |

**Output shape:** `sage: { synthesis_md, task_deltas[], deferred[], open_questions[] }`

**bars-agents:** `sage_consult`

---

## Coordinator checklist (after strand)

- [ ] Paste Sage **synthesis** into spec **Design Decisions** or `plan.md` Changelog.
- [ ] Open **PR-sized** updates to `tasks.md` only with checkboxes.
- [ ] If schema changes: follow [fail-fix workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
- [ ] Optional: append consult summary to `STRAND_OUTPUT.md` in this folder (pattern: other specs).

---

## Cursor subagent mapping (reference)

From [.cursor/rules/game-master-agents.mdc](../../../.cursor/rules/game-master-agents.mdc):

| Face | Cursor subagent |
|------|-----------------|
| shaman | explore |
| regent | evaluator |
| challenger | contrarian |
| architect | generalPurpose |
| diplomat | simplifier |
| sage | evaluator |

Use **bars-agents MCP** for BARS-domain synthesis when available; Cursor subagents when MCP offline.

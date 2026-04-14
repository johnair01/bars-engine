# Spec prework: I Ching cast + six Game Master faces

Use this **before** implementing a **spec kit** slice or a **named backlog item** when you want integration discipline (especially Sage sequencing, deftness, and API-first boundaries).

It is **optional** for typo fixes and one-line bugs; **recommended** for schema, new modules, cross-cutting UX, or anything that touches multiple specs.

---

## 1. Record the work

| Field | Value |
|--------|--------|
| **Spec kit / backlog ID** | e.g. `.specify/specs/pixel-identity-system-v0/`, **1.74 BOK** |
| **Phase / tasks** | e.g. `tasks.md` T1–T4 |
| **Dependencies already landed** | e.g. HWC before PIV |

---

## 2. Cast a hexagram (three-coin method)

**Six throws**, one per line from **bottom (line 1)** to **top (line 6)**. Each throw: sum three coins — head = 3, tail = 2 (or equivalent).

| Sum | Line type | In primary hexagram |
|-----|-----------|---------------------|
| 6 | Old yin | Yin, **moving** |
| 7 | Young yang | Yang |
| 8 | Young yin | Yin |
| 9 | Old yang | Yang, **moving** |

**Record:**

```
Line 1 (bottom): ___
Line 2: ___
Line 3: ___
Line 4: ___
Line 5: ___
Line 6 (top): ___
```

**Primary hexagram** (King Wen 1–64): yang = 7/9, yin = 6/8 — map bits bottom→top to number + name.

**Moving lines:** 6 and 9 only — flip those lines to get the **relating hexagram** (trend / if lesson ignored).

**Optional:** use `crypto`-quality RNG in a one-off script if physical coins are not available; note that in the record.

---

## 3. Six Game Master faces — interpret *this* cast for *this* work

Keep each face to a **short paragraph** tied to the **actual spec** (not generic platitudes). Faces: **Shaman**, **Regent**, **Challenger**, **Architect**, **Diplomat**, **Sage** (see project rules: [game-master-agents.mdc](../../.cursor/rules/game-master-agents.mdc)).

### Shaman (pattern, energy, what is felt)

*What does this hex ask players or stewards to **feel** if we ship this slice well vs poorly?*

### Regent (governance, boundaries, who approves)

*What rules, gates, or stewardship does the cast highlight for this release?*

### Challenger (risk, falsification)

*What would fail first if we are kidding ourselves? What is the smallest test or review that falsifies the wrong approach?*

### Architect (structure, migrations, ordering)

*What must be built in what order? What is the API or schema contract before UI?*

### Diplomat (We-quadrant, contributors, community tone)

*How do we describe the change fairly to humans who will maintain or distrust it?*

### Sage (integration)

*How does this slice sit **between** other specs and the backlog spine? What not to merge in the same breath?*

---

## 4. Sage synthesis (mandatory short block)

Write **5–10 sentences** that:

1. **Name the primary and relating hex** and one sentence of why they matter *for this task*.
2. **Commit to approach** aligned with [.agents/skills/deftness-development/SKILL.md](../../.agents/skills/deftness-development/SKILL.md): reduce rework tax, spec-first, deterministic paths where possible.
3. **State API-first or contract-first** artifacts (types, server action shapes, Prisma models, validation scripts) that must exist **before** deep UI.
4. **List explicit non-goals** for this pass (what *Jié*-style limitation applies).
5. **Point to the next dependency** in the backlog chain (if any).

---

## 5. After implementation

- [ ] **Verification** — spec Verification Quest / `tasks.md` checks; `npm run check` or scoped tests as per [fail-fix-workflow](../../.cursor/rules/fail-fix-workflow.mdc).
- [ ] **Update `tasks.md`** — check off completed tasks in the spec kit.

---

## Appendix: examples (filled)

| Work | Primary | Relating | One-line read |
|------|---------|----------|----------------|
| **HWC** (humanoid v1 contract) | 4 *Méng* (Youthful Folly) | 47 *Kùn* | Learn the contract at the **feet** (anchor); skip metadata → entanglement. |
| **PIV** (pixel identity v0) | 1 *Qián* (The Creative) | 60 *Jié* (Limitation) | Strong push to unify identity → URL; **measure** scope (resolver only, no compositor in v0). |
| **BOK** (Book OS v1 authoring) | 56 *Lǚ* (The Wanderer) | *(line 5 old yang → yin)* — settle / limit | Travel light between tools (ingestion vs manuscript), but **soften the top line**: freeze **approval** + **sections** before chasing full agent orchestra. |

Related bundle context: [SIX_FACES_CONCLAVE_BUNDLE.md](../conclave/construc-conclave-9/SIX_FACES_CONCLAVE_BUNDLE.md).

**Backlog / issues hygiene:** [backlog-github-issue-audit.md](./backlog-github-issue-audit.md).

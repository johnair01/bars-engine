# IMPLEMENTATION_PLAYBOOK — Low-Token Development for BARs Engine

This playbook exists to minimize agent token usage while keeping changes coherent with the project’s foundations.

Read these docs first:
- FOUNDATIONS.md (ontology + intent)
- ARCHITECTURE.md (mapping intent → mechanics)

This playbook is operational. It is not philosophical.

---

## Prime Directive
**Small diffs, explicit evidence, deterministic checks.**

Agents are expensive when they:
- infer repo structure
- debate architecture
- propose multiple options
- rewrite large surfaces
- explain at length

This playbook prevents that.

---

## Output Format Rules (Hard)
For any development request, responses must be:

1) **Discovery (grep-first)**
   - show the exact `rg` (ripgrep) commands used
   - list file paths found
   - 1-line summary per file
   - no code changes yet

2) **Plan for ONE Phase**
   - define scope: what will change, what will not
   - list exact files to modify/create
   - list acceptance checks (commands + expected result)

3) **Implementation**
   - apply minimal diffs only for that phase
   - avoid refactors unless required to pass tests

4) **Report**
   - `git diff --stat`
   - list modified files
   - commands run
   - results summary

**Do not output more than ~180 lines unless explicitly requested.**

---

## The Four Phases (Do them in order)
Do not skip phases. Do not combine phases unless explicitly instructed.

### Phase 0 — Map
Goal: find relevant code locations before touching anything.

Deliverable:
- paths + summaries for:
  - BAR model + schema
  - artifact linking
  - quest generation + Twine
  - vibeulon minting
  - admin/role/visibility logic (if any)

### Phase 1 — Forking Primitive
Goal: add fork lineage to BARs with minimal surface change.

Minimum requirements:
- BAR fields:
  - `parentBarId` (nullable)
  - `forkRootId`
  - `forkDepth`
  - `branchTag` (nullable)
- service: `forkBar(barId, userId)`
- tests: 3 lineage tests

No UI required unless a route already exists for forking.

### Phase 2 — Ratification Log (Holacracy-Compatible)
Goal: record governance events with role-based permission checks.

Minimum requirements:
- `Role`
- `RoleAssignment`
- `BarRatification` (append-only event log)
- service: `ratifyBar(barId, userId, newStage, note?)`
- tests: permission + logging tests

Do not implement full circles/quorum/policy editing in this phase.

### Phase 3 — Visibility Helper
Goal: implement deterministic visibility rules with tests.

Minimum requirements:
- `visibilityLevel` enum on BAR (or equivalent access field)
- helper functions:
  - `canViewBar(user, bar)`
  - `barWhereClauseFor(user)`
- tests: scenario fixtures covering at least:
  - owner view
  - public view
  - nation-scoped view (role)
  - archetype-scoped view (role)
  - admin/system view
  - fork lineage view (if applicable)

### Phase 4 — Weight + Minting
Goal: descriptive weight and inspiration minting based on real work.

Minimum requirements:
- deterministic `computeBarWeight(bar)` derived from:
  - SpecPhase and artifact counts/types
- update weight on BAR update
- mint vibeulons on spec advancement using weight delta
- tests: weight determinism

Avoid predictive “momentum multipliers.” Acceleration is emergent.

---

## Decision Rules (Anti-Drift)
When uncertain:

1) **Stop and ask for the exact file path** (or run `rg` to find it).
2) Prefer wrappers/adapters over invasive edits.
3) Prefer new small modules over rewriting existing large modules.
4) Do not change schema unless the phase requires it.
5) Keep behavior unchanged unless explicitly part of the phase.

---

## Agent Command Template (Use verbatim)
When running an agent (Cursor/Antigravity), use this template:

- Implement **only one phase** from this playbook.
- Run `rg` first and report findings.
- Make minimal diffs.
- Provide acceptance checks.
- Keep response under 180 lines.

---

## Acceptance Checks (Default)
Unless phase specifies otherwise, run:

- `npm test` (or repo’s test command)
- `npm run lint` (if present)
- `npm run build` (or `next build`)

If these are too slow, run only what the phase touches and state what was skipped.

---

## Commit Style
One phase = one branch = one PR-sized commit set.

Commit message format:
`phaseN: <short description>`

Examples:
- `phase1: add BAR fork lineage + forkBar service`
- `phase2: add role-based ratification event log`
- `phase3: add visibility helper and fixtures`
- `phase4: add BAR weight + minting on spec advancement`

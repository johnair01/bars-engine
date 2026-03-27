# Spec: Admin page composting & self-evolution via agents

## Purpose

Define how **admin surfaces** improve over time through **composting** (reusing and transforming existing work rather than piling new routes) and **bounded agent assistance**—so operators get **clearer orientation**, **fewer hostile or half-finished pages**, and **traceable change**, without handing agents unchecked control of production data or player trust.

**Depends on:** [admin-stewardship-four-moves](../admin-stewardship-four-moves/spec.md); [docs/runbooks/ADMIN_STEWARDSHIP.md](../../../docs/runbooks/ADMIN_STEWARDSHIP.md); [docs/runbooks/ADMIN_ROUTE_AUDIT.md](../../../docs/runbooks/ADMIN_ROUTE_AUDIT.md).

**Related ethos:** [CLAUDE.md](../../../CLAUDE.md) — *composting, not necromancy*; dual-track (AI and non-AI paths); *the game creates the game* (process artifacts legible in-world where appropriate).

---

## Problem statement

- **Surface entropy:** `/admin/*` grows faster than **purpose clarity**; some routes are experiments, duplicates, or **developer-console-shaped** UIs that do not match operator mental models.
- **No closed loop:** “What is this page for?” and “does it still earn its place?” are **not** systematically answered; [ADMIN_ROUTE_AUDIT.md](../../../docs/runbooks/ADMIN_ROUTE_AUDIT.md) inventories routes but does not **continuously** drive remediation.
- **Agent risk:** Delegating “fix admin” to agents without **invariants**, **scopes**, and **verification** invites **ontology drift** and silent harm (wrong instance, wrong campaign, confusing copy).

---

## Definitions (non-negotiable precision)

| Term | In this spec means | Not sufficient |
|------|---------------------|----------------|
| **Composting** | **Transform** existing UI, docs, or routes into **fewer, clearer** surfaces; **reuse** patterns (e.g. Quest ops cluster, Twine chrome); **archive or redirect** dead paths with **provenance** (why retired, what replaced it). | Renaming files only; deleting without replacement story; hiding errors. |
| **Self-evolution (admin)** | **Controlled** improvement cycles: observe friction → propose change → **human or policy gate** → implement → verify. Agents may **draft**, **audit**, **suggest**—not **merge to prod** without rules below. | “The model decided” with no metrics or rollback. |
| **Self-healing (admin)** | **Detectable** failures (broken links, build/lint regressions on touched admin files, missing orientation on a route) have **documented remediation paths**; agents may **open tasks** or **PRs** within scope. | Auto-editing production DB or bypassing auth. |

---

## Principles

1. **Challenger (safety):** Every agent action that touches **routing, copy, or data** is **scoped** (which tenant/instance/campaign) and **reversible** (PR, feature flag, or rollback).
2. **Architect (structure):** Prefer **composition** (hubs, shared chrome, four-move alignment) over **new top-level nav items** unless a new **job sentence** passes the purpose bar (see § Purpose review).
3. **Sage (integration):** Agent outputs feed **spec kit**, **BACKLOG**, or **runbooks**—not only chat—so the system **remembers** why something changed.
4. **Diplomat (language):** Operator-facing copy uses the **same terms** as stewardship docs (`Instance`, `EventCampaign`, moves)—[admin-stewardship-four-moves](../admin-stewardship-four-moves/spec.md) glossary.
5. **Regent (governance):** **Publish** of agent-suggested IA changes requires **human sign-off** (or an explicit automated policy with tests).

---

## Purpose review (per route / cluster)

Each admin route or **cluster** (e.g. Books hub + children) should admit:

| Field | Question |
|-------|------------|
| **Job sentence** | “This exists so that ___ can ___ without ___.” |
| **Effectiveness** | Does the critical path complete? Is this still the **right place** for the job? |
| **Deep audit?** | Fuzzy purpose, drift, high blast radius, hostile UX, or strategic fork → **yes**. |

**Acceptance (process):** At least one **reviewed** cluster documented per release cycle in `.specify/backlog/` or spec appendix until all **sidebar-reachable** routes have a one-line job sentence (may reference ADMIN_ROUTE_AUDIT rows).

---

## Agent charter (v1)

Agents (Cursor, bars-agents, or future automation) operate under:

| Capability | Allowed | Forbidden without human gate |
|------------|---------|--------------------------------|
| **Read** | Code, `docs/runbooks/*`, spec kit, `ADMIN_ROUTE_AUDIT` | Scraping player PII; production DB writes |
| **Draft** | Spec text, task lists, orientation copy, refactor plans | Deploying; merging to `main` |
| **Propose** | PRs; backlog entries; `cert_feedback` triage | Changing auth, billing, or schema in prod |
| **Verify** | Run `npm run check`, `npm run build`, targeted tests on a branch | Marking “done” without failing tests addressed |

**Sage / integration:** `sage_consult` and strand-style flows are **advisory**; implementation authority remains **spec kit + human**.

---

## Control loops (target state)

### Loop A — Audit freshness

1. **Trigger:** Calendar (e.g. quarterly) or major admin IA change.
2. **Observe:** Diff `src/app/admin/**/page.tsx` vs [ADMIN_ROUTE_AUDIT.md](../../../docs/runbooks/ADMIN_ROUTE_AUDIT.md) matrix.
3. **Act:** Update audit doc + CSV; open backlog items for **merge / deprecate / integrate**.
4. **Verify:** Link from [ADMIN_STEWARDSHIP.md](../../../docs/runbooks/ADMIN_STEWARDSHIP.md) still valid.

### Loop B — Friction → compost

1. **Trigger:** Operator notes, cert feedback, or agent-suggested “purpose mismatch.”
2. **Observe:** Job sentence fails or UX is hostile.
3. **Act:** Spec a **hub**, **redirect**, or **merge**; implement in small PRs.
4. **Verify:** `npm run build` && `npm run check`; spot-check operator path.

### Loop C — Agent-suggested orientation

1. **Trigger:** New complex route ships.
2. **Act:** Agent drafts **orientation blurb** (four-move zone + one-line purpose) for admin dashboard or page header.
3. **Verify:** Human edits for tone; matches [UI_COVENANT.md](../../../UI_COVENANT.md) if UI.

---

## User stories

1. **As a steward**, I can read **why** a cluster of admin pages exists and **what success looks like** without opening the codebase.
2. **As a developer**, I can run an **agent job** (prompt + scope) that outputs **backlog-ready** composting proposals **grounded in** route audit + spec kit—not a generic rewrite.
3. **As the project**, we **reduce** duplicate or orphan admin paths over time while **preserving** audit trails (redirects, changelog in spec or runbook).

## Out of scope (v1)

- Fully autonomous admin redesign or auto-merge without CI green.
- Replacing human judgment on **campaign ethics**, **player data**, or **Portland-community-facing** copy.
- Non-admin “self-evolving” product behavior (covered by a future platform spec if needed).

## Acceptance criteria

### Spec & docs

- [ ] This spec kit exists with **plan** and **tasks**; linked from [ADMIN_STEWARDSHIP.md](../../../docs/runbooks/ADMIN_STEWARDSHIP.md) “Related” section.
- [ ] **Agent charter** and **definitions** are copy-pasteable into agent prompts.

### Process (lightweight)

- [ ] **Purpose review** template exists (table or subsection) usable per cluster—may live in this spec or `docs/runbooks/`.
- [ ] **Loop A** (audit freshness) has an **owner** and **cadence** named in plan or runbook (even if “TBD quarterly”).

### Implementation (optional phases)

- [ ] No mandatory code ship in v1; follow-on tasks may add scripts (`scripts/verify-admin-routes.ts`) or dashboard links—see [plan.md](./plan.md).

---

## Appendix: Example job sentences

| Cluster | Example job sentence |
|---------|----------------------|
| **Books** | So stewards can **extract moves and quests from books** into engine-ready artifacts **without** losing source traceability. |
| **Quest ops** | So authors can **move between catalog, grammar, context generation, and proposals** as **one job** without hunting four nav entries. |
| **Instances** | So operators can **see and set active campaign/instance context** and **avoid wrong-tenant edits**. |

(Extend in implementation notes as clusters are reviewed.)

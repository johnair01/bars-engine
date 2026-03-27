# Plan: Admin page composting & self-evolution via agents

Implement per [`.specify/specs/admin-page-composting-agent-evolution/spec.md`](./spec.md).

## Phase 0 — Spec kit & linkage (canonical)

1. Finalize **spec.md** (definitions, charter, loops).
2. Add **Related** link from [docs/runbooks/ADMIN_STEWARDSHIP.md](../../../docs/runbooks/ADMIN_STEWARDSHIP.md) to this spec.
3. Optionally add one paragraph to [docs/runbooks/ADMIN_ROUTE_AUDIT.md](../../../docs/runbooks/ADMIN_ROUTE_AUDIT.md) Summary pointing at **composting / agent evolution** process (no matrix rewrite required).

## Phase 1 — Purpose review artifact

1. Add a short **purpose review template** (markdown table: route/cluster, job sentence, effectiveness, deep audit Y/N, notes)—either:
   - subsection of this spec’s appendix, or
   - `docs/runbooks/ADMIN_PURPOSE_REVIEW.md` (single source for ongoing fills).
2. Seed **2–3 example rows** (e.g. Books, Quest ops, Instances) matching spec appendix.

## Phase 2 — Agent workflow packaging

1. Document **minimum prompt** for agents: scope (read-only vs PR), charter bullets, link to `ADMIN_ROUTE_AUDIT` + this spec.
2. If using **cert feedback** or **backlog** triage: reference [.agents/skills/cert-feedback-triage/SKILL.md](../../../.agents/skills/cert-feedback-triage/SKILL.md) for how admin friction reports become spec tasks.

## Phase 3 — Automation hooks (optional)

1. **Script** (optional): `scripts/diff-admin-routes-vs-audit.ts` or extend existing verify scripts to warn when new `page.tsx` under `admin/` lacks an audit row (non-blocking in CI at first).
2. **Admin dashboard** (optional): link block “Composting & evolution” → this spec + purpose review doc.

## Ordering

**0 → 1 → 2** for value; **3** when ready to enforce or nudge via CI.

## File impact (expected)

| Area | Files |
|------|--------|
| Spec kit | `.specify/specs/admin-page-composting-agent-evolution/*` |
| Runbooks | `docs/runbooks/ADMIN_STEWARDSHIP.md`, optional `ADMIN_PURPOSE_REVIEW.md`, optional tweak `ADMIN_ROUTE_AUDIT.md` |
| Agents | `.cursor/rules` or skill docs only if a reusable rule is warranted—defer until prompts stabilize |

## Dependency

**Does not** replace [admin-stewardship-four-moves](../admin-stewardship-four-moves/spec.md); it **extends** stewardship with **evolution and agent bounds**.

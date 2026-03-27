# Tasks: Admin page composting & self-evolution via agents

## Phase 0 — Spec kit & linkage

- [x] **P0.1** Confirm **spec.md** / **plan.md** / **tasks.md** reflect definitions, charter, and loops (edit if gaps found during review).
- [x] **P0.2** Add **Related** link to this spec from [docs/runbooks/ADMIN_STEWARDSHIP.md](../../../docs/runbooks/ADMIN_STEWARDSHIP.md).
- [x] **P0.3** (Optional) Add **Summary** note in [docs/runbooks/ADMIN_ROUTE_AUDIT.md](../../../docs/runbooks/ADMIN_ROUTE_AUDIT.md) pointing to composting/agent-evolution process.

## Phase 1 — Purpose review artifact

- [ ] **P1.1** Create **purpose review** template (table: cluster/route, job sentence, effectiveness, deep audit Y/N, notes) in spec appendix **or** [docs/runbooks/ADMIN_PURPOSE_REVIEW.md](../../../docs/runbooks/ADMIN_PURPOSE_REVIEW.md).
- [ ] **P1.2** Seed **2–3 example rows** (Books, Quest ops, Instances or equivalents).

## Phase 2 — Agent workflow packaging

- [ ] **P2.1** Add **minimum agent prompt** block (scope, charter, links) to spec appendix or `docs/runbooks/ADMIN_STEWARDSHIP.md`.
- [ ] **P2.2** Cross-link to cert feedback / backlog triage skill if admin friction is reported via `.feedback/`.

## Phase 3 — Automation (optional)

- [ ] **P3.1** (Optional) Script or CI check: new admin `page.tsx` warns if missing from route audit.
- [ ] **P3.2** (Optional) Admin dashboard link block to this spec + purpose review.

## Verification

- [ ] **V1** `npm run build` && `npm run check` after any code or script added in Phase 3.

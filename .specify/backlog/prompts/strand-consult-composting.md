# Prompt: Strand Consult Composting

> Explore and implement strand consult merge/compost policy per [.specify/specs/strand-consult-composting/spec.md](../specs/strand-consult-composting/spec.md). Create plan.md and tasks.md; document merge/compost policy and retention rules; optionally implement `compost:strand-consults` script. Run build and check.

## Context

Strand consults produce `STRAND_CONSULT.md`, `GM_CONSULT.md`, `STRAND_CONSULT_POROSITY.md`, etc. in spec directories. ~10 such files exist (99–192 lines each). No process exists for merging or composting them.

**Pattern to follow**: [scripts/compost-backlog.ts](../../scripts/compost-backlog.ts) — moves Done/Superseded backlog rows to ARCHIVE.md; keeps BACKLOG.md actionable.

## Exploration Questions

1. **Merge** — When re-consulting a spec, append vs overwrite vs merge? "Consult v2 absorbs v1"?
2. **Compost** — When recommendations are integrated into spec/plan/tasks, archive the raw consult? Retention policy?
3. **Wieldy** — Split by face? Size limits? What keeps files manageable?
4. **Script** — Analogous to `compost:backlog` for strand consults?

## Deliverables

- [ ] **plan.md** — Phases: (1) Policy definition, (2) Archive location, (3) Script design, (4) Wieldy rules
- [ ] **tasks.md** — Checkable tasks for policy doc, optional script, design doc update
- [ ] **Policy doc** — Merge/compost policy and retention rules (in plan or separate POLICY.md)
- [ ] **Optional**: `scripts/compost-strand-consults.ts` + `npm run compost:strand-consults` — move integrated consults to `.specify/backlog/ARCHIVE_STRAND_CONSULTS.md` or `.specify/archive/strand-consults/`
- [ ] **Spec update** — Fill in acceptance criteria in spec.md from exploration

## References

- Spec: [.specify/specs/strand-consult-composting/spec.md](../specs/strand-consult-composting/spec.md)
- Compost backlog script: [scripts/compost-backlog.ts](../../scripts/compost-backlog.ts)
- Consult file inventory: `find .specify/specs -name "*CONSULT*" -type f`

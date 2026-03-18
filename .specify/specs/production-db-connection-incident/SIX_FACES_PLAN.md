# Six Faces Plan: Production DB Connection Incident

**Incident**: Production deploy cannot connect to the database; players cannot log in.

**Approach**: Each Game Master face contributes a lens and concrete actions to diagnose, fix, and prevent recurrence.

---

## Shaman (Magenta) — Threshold, Mystery, Initiation

**Lens**: What is the *hidden* or *unspoken* cause? What threshold was crossed?

**Contribution**:
- **Read the signs**: Run `npm run diagnose:prod-db` with production `DATABASE_URL`. The output reveals what the system *actually* sees—migrations applied, schema state, row counts. Don't assume; witness.
- **Name the tension**: The prior incident (eca6283) was "db push without migration files." The same pattern may have repeated: schema changed, migration added, but deploy path allowed build to succeed without applying it. Name it: *"We crossed the threshold from 'dev works' to 'prod broken' when migrate deploy failed silently."*
- **Action**: Before any fix, run diagnose. Document the exact error message or state. If players can't log in, the failure is likely at session/auth or first DB query—trace which query fails.

---

## Challenger (Red) — Testing, Confrontation, Courage

**Lens**: What are we *not* testing? What would break this again?

**Contribution**:
- **Provoke the build**: The build script catches migrate deploy failure and continues. That's a *design choice*—but it hides failure. Challenge: *"Should the build fail when migrate deploy fails?"* If yes, change `build-with-env.ts` to exit 1 on migrate failure instead of falling back.
- **Stress-test prod parity**: Add a CI step (or pre-deploy check) that runs `prisma migrate deploy` against a staging/prod-like DB and fails if it errors. Don't ship code that can't migrate.
- **Action**: Add `--fail-on-migrate` or equivalent so Vercel build fails loudly when migrations can't be applied, instead of deploying a broken app.

---

## Regent (Amber) — Authority, Coherence, Law

**Lens**: What are the *rules*? Who enforces them?

**Contribution**:
- **Rule**: Every schema change that ships must have a migration file. `db push` is for local iteration only. (Already in fail-fix-workflow.mdc; enforce it.)
- **Rule**: Production deploy must not succeed if `prisma migrate deploy` fails. The Regent says: *"The build shall not pass without migrations applied."*
- **Rule**: `DATABASE_URL` must be set for Production scope in Vercel. Document and verify.
- **Action**: Update `scripts/build-with-env.ts` to fail the build when migrate deploy fails (no silent fallback). Add a Vercel env checklist to `docs/ENV_AND_VERCEL.md` for production.

---

## Architect (Orange) — Structure, Pattern, Logic

**Lens**: How is the *structure* causing this? Can we reduce failure modes?

**Contribution**:
- **Structure**: The deploy pipeline has two paths—migrate success and migrate failure. The failure path leads to a deployed app with mismatched schema. Reduce to one path: migrate must succeed.
- **Structure**: Consider a pre-migrate health check: before `next build`, verify that the DB is reachable and that the latest migration can be applied. Fail fast.
- **Action**: Refactor `build-with-env.ts` so that `prisma migrate deploy` is mandatory. Remove the fallback that allows build to proceed without migrations. Optionally add a `prisma migrate status` check before deploy.

---

## Diplomat (Green) — Relationship, Translation, Trust

**Lens**: How do we *communicate* so this doesn't surprise anyone?

**Contribution**:
- **Translate for operators**: When migrate fails, the error should be clear: "Migration failed. Production DB may be out of sync. Fix: run `prisma migrate deploy` with prod DATABASE_URL, or resolve migration conflicts."
- **Translate for contributors**: `docs/ENV_AND_VERCEL.md` and `docs/AGENT_WORKFLOWS.md` should state: "Before merging schema changes, ensure migration file exists and `prisma migrate deploy` succeeds locally against a prod-like DB."
- **Action**: Improve error messages in build script. Add a "Production deploy checklist" section to docs with: DATABASE_URL set, migrate deploy tested, no db push in prod path.

---

## Sage (Teal) — Spaciousness, Witness, Transcendence

**Lens**: What is the *meta-pattern*? What do we learn?

**Contribution**:
- **Synthesis**: The incident is a *recurrence* (eca6283 already referenced it). The root cause is structural: the build allows success when migrations fail. Fix the structure, not just the symptom.
- **Convergence**: All six faces point to one change: **make migrate deploy mandatory in the build**. Shaman says witness first; Challenger says test it; Regent says enforce it; Architect says structure it; Diplomat says communicate it; Sage says: do it.
- **Action**: Implement the unified fix: build fails when migrate deploy fails. Run diagnose to confirm current prod state. Apply migrations manually if needed. Document in INCIDENTS.md (or equivalent) with prevention steps.

---

## Execution Order

| Step | Face | Action |
|------|------|--------|
| 1 | Shaman | Run `DATABASE_URL="<prod>" npm run diagnose:prod-db`; document output |
| 2 | Architect + Regent | Apply migrations if needed: `prisma migrate deploy` or `migrate resolve` |
| 3 | Architect | Refactor `build-with-env.ts`: fail build on migrate deploy failure |
| 4 | Challenger | Add CI/pre-deploy check: migrate deploy against staging |
| 5 | Diplomat | Update docs: production checklist, clearer error messages |
| 6 | Sage | Write incident summary; add to INCIDENTS.md or similar |

---

## References

- [ROOT_CAUSE_ANALYSIS.md](./ROOT_CAUSE_ANALYSIS.md)
- [scripts/build-with-env.ts](../../../scripts/build-with-env.ts)
- [scripts/diagnose-prod-db.ts](../../../scripts/diagnose-prod-db.ts)
- [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md)

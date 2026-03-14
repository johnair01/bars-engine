# Spec: Dev Setup Anti-Fragile — Smoother Onboarding, Loop Readiness, and Incident Learning

## Purpose

Make the developer setup and loop-readiness process less fragile and easier for new contributors. Learn from emergent issues (schema drift, failed migrations, missing seeds, env loading) and create documentation and tooling that makes the system anti-fragile.

**Problem**: Setup is fragmented across multiple docs. Loop readiness fails with opaque errors. New developers hit schema/migration/seed issues without clear remediation. The process we just went through (adventureType drop, failed migration resolve, seed ordering) was not deft.

**Practice**: Deftness Development — single-command where possible, remediation hints on failure, incident documentation that feeds back into docs.

## Emergent Issues (Lessons Learned)

| Issue | Root Cause | Fix | Doc Gap |
|-------|------------|-----|---------|
| **db:sync fails with "drop column adventureType"** | Schema removed column; DB still had it; db push warns data-loss | Create migration to drop; use migrate deploy | No runbook for schema drift when db push refuses |
| **P3009: migrate found failed migrations** | Migration started but failed; Prisma blocks new migrations | resolve --applied if table exists; --rolled-back if not | ENV_AND_VERCEL has it; not in onboarding |
| **loop:ready fails "Missing quest: orientation-quest-1"** | Pre-launch seeds not run | Run seed:onboarding (or full seed sequence) | loop:ready doesn't suggest fix |
| **loop:ready fails "column agentMetadata does not exist"** | Schema added column; DB not synced | migrate deploy or db:sync | Unclear when to use migrate vs push |
| **Vercel deploy stuck in initialization** | Platform/queue issue | Delete old deployments; check queue; wait | Resolved Mar 2025 |
| **Developer runs migrate dev, others use db push** | Inconsistent DB strategy | Document: prod = migrate deploy; local = migrate deploy (preferred) or db:sync | DEVELOPER_ONBOARDING says migrate dev; build uses migrate deploy |

## User Stories

### P1: Single bootstrap command

**As a** new developer, **I want** one command that gets me to a working state (env, schema, seeds, loop:ready), **so** I don't have to remember the order of 5+ steps.

**Acceptance**: `npm run setup` or `npm run bootstrap` runs: env check → migrate deploy → pre-launch seeds (party, quest-map, onboarding, cert:cyoa) → loop:ready:quick. Fails fast with clear message at first error.

### P2: Loop readiness suggests remediation

**As a** developer, **I want** loop:ready to tell me how to fix each failure, **so** I don't have to search docs or ask.

**Acceptance**: When a check fails, output includes "Fix: run X" or "See: docs/Y". E.g. "Missing quest: orientation-quest-1" → "Fix: npm run seed:onboarding".

### P3: Incident documentation

**As a** maintainer, **I want** emergent issues documented with root cause and fix, **so** we learn and don't repeat.

**Acceptance**: `docs/INCIDENTS.md` or `.specify/specs/dev-setup-anti-fragile/INCIDENTS.md` exists; each incident has: symptom, root cause, fix, doc update (if any).

### P4: Unified DB strategy doc

**As a** developer, **I want** one place that explains when to use migrate vs db push, **so** I don't create drift.

**Acceptance**: docs/ENV_AND_VERCEL.md or new docs/DB_STRATEGY.md explains: prod = migrate deploy; local = migrate deploy (recommended) or db:sync; when schema changes, run migrate deploy (or create migration + deploy). No conflicting advice in DEVELOPER_ONBOARDING.

### P5: Pre-launch seeds in onboarding

**As a** new developer, **I want** the pre-launch seed sequence in the main onboarding doc, **so** loop:ready passes after setup.

**Acceptance**: DEVELOPER_ONBOARDING §4 includes the full seed sequence (party, quest-map, onboarding, cert:cyoa) or links to a single setup script.

## Functional Requirements

### Phase 1: Documentation and remediation hints

- **FR1**: Add remediation hints to loop-readiness.ts — for each failure mode, output "Fix: <command>" or "See: <doc>".
- **FR2**: Create INCIDENTS.md (or section in spec) documenting: adventureType drop, P3009 resolve, missing orientation-quest-1, agentMetadata column.
- **FR3**: Add "DB strategy" section to ENV_AND_VERCEL or create docs/DB_STRATEGY.md — migrate deploy vs db push, when to use each.
- **FR4**: Update DEVELOPER_ONBOARDING §4 to use migrate deploy + full seed sequence (or npm run setup).

### Phase 2: Bootstrap script (optional)

- **FR5**: Add `npm run setup` that: checks DATABASE_URL → migrate deploy → seeds (party, quest-map, onboarding, cert:cyoa) → loop:ready:quick. Idempotent where possible.
- **FR6**: setup script fails fast with clear error and remediation at first failure.

### Phase 3: Loop readiness improvements

- **FR7**: loop:ready "Core quest configuration" failure for missing orientation-quest-1 includes: "Fix: npm run seed:onboarding (or npm run setup)".
- **FR8**: loop:ready "Build passes" failure suggests: "Fix: npm run db:sync or npx tsx scripts/with-env.ts 'prisma migrate deploy'".
- **FR9**: Consider adding a "schema sync" pre-check before other checks (migrate deploy or db push) so Prisma client matches DB.

## Non-Goals

- Changing the underlying migration strategy (migrate vs push) — document and simplify, don't rewrite
- Fixing Vercel platform issues — out of scope
- Replacing loop:ready with a different tool — improve it

## Architect + Regent Analysis

See [ARCHITECT_REGENT_ANALYSIS.md](ARCHITECT_REGENT_ANALYSIS.md) for a deeper take on:
- Energy cost of roadblocks (the plan addresses remediation, not prevention)
- Whether seeding is the right paradigm vs agent-generated quests
- Lazy bootstrap and convention-based resolution as structural improvements

## Dependencies

- [LOOP_READINESS_CHECKLIST](../../docs/LOOP_READINESS_CHECKLIST.md)
- [DEVELOPER_ONBOARDING](../../docs/DEVELOPER_ONBOARDING.md)
- [ENV_AND_VERCEL](../../docs/ENV_AND_VERCEL.md)
- [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md)

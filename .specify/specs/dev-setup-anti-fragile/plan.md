# Plan: Dev Setup Anti-Fragile

## Summary

Document emergent issues, add remediation hints to loop:ready, unify DB strategy docs, and optionally add a single `npm run setup` command. Make the process less fragile for new developers.

## Implementation Order

### Phase 1: Documentation (no code changes to core logic)

1. **INCIDENTS.md** — Create `.specify/specs/dev-setup-anti-fragile/INCIDENTS.md` with:
   - adventureType drop (schema drift, db push data-loss)
   - P3009 failed migration (spec_kit_backlog)
   - Missing orientation-quest-1 (seeds not run)
   - agentMetadata column (schema ahead of DB)
   - Each: symptom, root cause, fix, doc reference

2. **DB strategy** — Add section to docs/ENV_AND_VERCEL.md or create docs/DB_STRATEGY.md:
   - Production: migrate deploy (during build)
   - Local: migrate deploy (recommended) or db:sync
   - When schema changes: create migration + migrate deploy; db push only for rapid prototyping
   - Resolve: DEVELOPER_ONBOARDING says "migrate dev" — change to "migrate deploy" for first-time, or document the hybrid

3. **DEVELOPER_ONBOARDING.md** — Update §4:
   - Replace "migrate dev" with "migrate deploy" (or add both with explanation)
   - Add full pre-launch seed sequence: seed:party, seed:quest-map, seed:onboarding, seed:cert:cyoa
   - Or: "Run npm run setup" (when implemented)

### Phase 2: Loop readiness remediation hints

4. **loop-readiness.ts** — Add remediation map:
   - "Missing quest: orientation-quest-1" → "Fix: npm run seed:onboarding. For full setup: npm run seed:party && npm run seed:quest-map && npm run seed:onboarding && npm run seed:cert:cyoa"
   - "Missing quest: system-feedback" → "Fix: npm run seed:onboarding"
   - "Build passes" FAIL → "Fix: npm run db:sync or npx tsx scripts/with-env.ts 'prisma migrate deploy'"
   - "Feedback cap" / Prisma errors → "Fix: Schema may be out of sync. Run: npx tsx scripts/with-env.ts 'prisma migrate deploy'"

5. **Output format** — When a check fails, append:
   ```
   Fix: <command or doc>
   See: docs/...
   ```

### Phase 3: Bootstrap script (optional)

6. **scripts/setup-dev.ts** — New script:
   - Check DATABASE_URL (exit with message if missing)
   - Run migrate deploy
   - Run seeds in order: party, quest-map, onboarding, cert:cyoa
   - Run loop:ready:quick
   - Fail fast, clear errors

7. **package.json** — Add "setup": "tsx scripts/setup-dev.ts"

## File Impacts

| Action | File |
|--------|------|
| Create | `.specify/specs/dev-setup-anti-fragile/INCIDENTS.md` |
| Create | `docs/DB_STRATEGY.md` (or add to ENV_AND_VERCEL) |
| Edit | `docs/DEVELOPER_ONBOARDING.md` §4 |
| Edit | `scripts/loop-readiness.ts` — remediation hints |
| Create | `scripts/setup-dev.ts` (optional) |
| Edit | `package.json` — add setup script (optional) |

## Verification

- New developer clones and runs setup; loop:ready passes
- loop:ready fails with missing quest → output includes "Fix: npm run seed:onboarding"
- INCIDENTS.md is findable and useful for debugging
- No conflicting advice between DEVELOPER_ONBOARDING and ENV_AND_VERCEL

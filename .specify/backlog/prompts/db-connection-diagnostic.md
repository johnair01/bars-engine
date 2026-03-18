# Prompt: DB Connection Diagnostic

**Use this prompt when implementing the observe-before-act DB diagnostic.**

## Objective

Implement the DB Connection Diagnostic spec per [.specify/specs/db-connection-diagnostic/spec.md](../specs/db-connection-diagnostic/spec.md). Add a diagnostic script that reports which database URL the app uses and whether that database has the expected tables. No speculation. Observe first, then act.

## Checklist

### Phase 1: Extract resolution logic

- [x] Create `src/lib/db-resolve.ts` with `resolveDatabaseUrl()` (same logic as db.ts)
- [x] Update `src/lib/db.ts` to import from db-resolve

### Phase 2: Diagnostic script

- [x] Create `scripts/diagnose-db-connection.ts`
- [x] Add `npm run diagnose:db` to package.json

### Phase 3: Documentation

- [x] Update INCIDENTS.md incident #0
- [x] Update docs/ENV_AND_VERCEL.md troubleshooting

## Reference

- Spec: [.specify/specs/db-connection-diagnostic/spec.md](../specs/db-connection-diagnostic/spec.md)
- Plan: [.specify/specs/db-connection-diagnostic/plan.md](../specs/db-connection-diagnostic/plan.md)
- Tasks: [.specify/specs/db-connection-diagnostic/tasks.md](../specs/db-connection-diagnostic/tasks.md)

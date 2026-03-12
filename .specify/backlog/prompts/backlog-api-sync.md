# Prompt: Backlog API Sync

**Use this prompt when implementing cross-machine backlog sync.**

## Objective

Implement the Backlog API Sync per [.specify/specs/backlog-api-sync/spec.md](../specs/backlog-api-sync/spec.md). Add SpecKitBacklogItem model, GET/PATCH API, seed from BACKLOG.md, regen script, and backlog:fetch. Enables any machine to fetch latest backlog without git pull. Use `backlog:fetch -- --write-md` to update BACKLOG.md from API (for machines without DB).

## Checklist

- [ ] SpecKitBacklogItem model + migration
- [ ] GET /api/backlog
- [ ] PATCH /api/backlog/:id (admin)
- [ ] scripts/seed-spec-kit-backlog.ts
- [ ] scripts/regenerate-backlog-md.ts
- [ ] scripts/backlog-fetch.ts
- [ ] npm run backlog:seed, backlog:regen, backlog:fetch

## Reference

- Spec: [.specify/specs/backlog-api-sync/spec.md](../specs/backlog-api-sync/spec.md)
- Plan: [.specify/specs/backlog-api-sync/plan.md](../specs/backlog-api-sync/plan.md)

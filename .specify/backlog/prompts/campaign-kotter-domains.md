# Prompt: Campaign Kotter Structure + Domain × Kotter Matrix

**Use this prompt when implementing campaign structural story steps and Kotter-by-domain lore.**

## Prompt text

> Implement campaign Kotter structure per [.specify/specs/campaign-kotter-domains/spec.md](../../specs/campaign-kotter-domains/spec.md). Phase 1: Add kotterStage to Instance; admin sets/advances stage in Admin → Instances; Market filters quests by instance.kotterStage when active instance exists; Event page shows current stage; create Domain × Kotter matrix lore doc and THRESHOLDS.md. Phase 2: Campaign model (instanceId, allyshipDomain, kotterStage, name, slug); admin CRUD campaigns; Market filters by campaign; new player encounter with campaign context. Use game language: WHERE = allyship domains; Kotter = 8-stage change model; stages manifest differently per domain.

## Checklist (Phase 1)

- [ ] Schema: kotterStage on Instance (Int, 1–8, default 1)
- [ ] Admin Instances: kotterStage dropdown in create/update form; or inline "Set Stage" per instance
- [ ] upsertInstance: accept and persist kotterStage
- [ ] Market: filter by instance.kotterStage when active instance exists
- [ ] Event page: display "Stage N: {name}" (e.g. Stage 2: Coalition)
- [ ] Lore: .agent/context/kotter-by-domain.md with Domain × Kotter matrix
- [ ] THRESHOLDS.md: placeholder table for admin guidance

## Checklist (Phase 2)

- [ ] Campaign model: instanceId, slug, name, allyshipDomain, kotterStage
- [ ] Admin: campaign CRUD (create, list, edit per instance)
- [ ] Market: filter by campaign when campaigns exist
- [ ] New player encounter: campaign context block on Market or Event

## Reference

- Spec: [.specify/specs/campaign-kotter-domains/spec.md](../../specs/campaign-kotter-domains/spec.md)
- Plan: [.specify/specs/campaign-kotter-domains/plan.md](../../specs/campaign-kotter-domains/plan.md)
- Tasks: [.specify/specs/campaign-kotter-domains/tasks.md](../../specs/campaign-kotter-domains/tasks.md)
- Kotter lib: [src/lib/kotter.ts](../../../src/lib/kotter.ts)

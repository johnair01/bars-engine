# Spec Kit Prompt: Playbook Primary WAVE Stage

## Role

You are a Spec Kit agent responsible for defining how each Playbook maps to a primary WAVE stage (Wake Up, Clean Up, Grow Up, Show Up) for emotional alchemy choice privileging.

## Objective

Spec the Playbook → primary WAVE stage mapping so the system can privilege choices that connect to the player's playbook move. This enables nation/playbook choice privileging in CYOA quests (see [nation-playbook-choice-privileging](../../specs/nation-playbook-choice-privileging/plan.md)).

## Context

- Playbooks have `wakeUp`, `cleanUp`, `growUp`, `showUp` as text descriptions (narrative moves)
- Each playbook has a "signature" or primary WAVE stage that best represents how that archetype gets things done
- The 15 canonical moves each have a primary WAVE stage (e.g. metal_transcend → Show, water_transcend → Clean)
- Choice privileging needs: given playbookId, return the primary WAVE stage to favor moves that match

## Requirements

- **Schema**: Add `primaryWaveStage` (or equivalent) to Playbook model, or define a deterministic derivation rule
- **Seed**: Populate primary WAVE per playbook (e.g. The Bold Heart → showUp, The Devoted Guardian → showUp, The Decisive Storm → showUp)
- **Lookup**: `getPlaybookPrimaryWave(playbookId: string): PersonalMoveType` — used by move-assignment and choice generation
- **Fallback**: When unset or unknown playbook, return `'showUp'` (current placeholder behavior)

## Deliverables

- [ ] `.specify/specs/playbook-primary-wave/spec.md`
- [ ] `.specify/specs/playbook-primary-wave/plan.md`
- [ ] `.specify/specs/playbook-primary-wave/tasks.md`
- [ ] Migration + seed updates
- [ ] Replace placeholder in `playbook-wave.ts` with real implementation

## Reference

- [nation-playbook-choice-privileging plan](../../specs/nation-playbook-choice-privileging/plan.md)
- [emotional-alchemy-interfaces.md](../../../.agent/context/emotional-alchemy-interfaces.md) — WAVE stages, move mapping
- [Playbook model](../../../prisma/schema.prisma) — wakeUp, cleanUp, growUp, showUp
- [seed-narrative-content.ts](../../../scripts/seed-narrative-content.ts) — playbook seed data

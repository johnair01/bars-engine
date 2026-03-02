# Prompt: Roadblock Metabolism System

**Use this prompt when implementing the Roadblock Metabolism System. Pre-commit type-check, validate-manifest script, agent skill, and FOUNDATIONS lore.**

## Context

In the BARS Engine, an Emergent Roadblock is a manifestation of misaligned intention—a knot in the pipeline of inspiration. When the system fails to metabolize a BAR (user request/signal), it produces a Roadblock Error. This system defines the ritual for metabolizing roadblocks before they manifest in the committed branch.

## Prompt text

> Implement the Roadblock Metabolism System per [.specify/specs/roadblock-metabolism/spec.md](../specs/roadblock-metabolism/spec.md). Add pre-commit hook that runs `npm run build:type-check` (tsc --noEmit). Create `scripts/validate-manifest.ts` that checks for files using hooks/client APIs without "use client". Create `.agents/skills/roadblock-metabolism/SKILL.md` with verification rules (imports vs exports, directive requirements), reflection step, and "Metabolizing a Roadblock" phrasing. Add "Metabolism of Roadblocks" section to FOUNDATIONS.md. Use game language: BAR (user signal), Roadblock (build error), Clean Up (metabolize before commit).

## Checklist

- [ ] Add build:type-check and validate-manifest scripts to package.json
- [ ] Install husky, create .husky/pre-commit
- [ ] Create scripts/validate-manifest.ts
- [ ] Create .agents/skills/roadblock-metabolism/SKILL.md
- [ ] Add Metabolism of Roadblocks section to FOUNDATIONS.md
- [ ] Verify: commit with type error is rejected

## Reference

- Spec: [.specify/specs/roadblock-metabolism/spec.md](../specs/roadblock-metabolism/spec.md)
- Plan: [.specify/specs/roadblock-metabolism/plan.md](../specs/roadblock-metabolism/plan.md)
- Tasks: [.specify/specs/roadblock-metabolism/tasks.md](../specs/roadblock-metabolism/tasks.md)
- Backlog: F (1.2)

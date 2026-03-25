# Backlog prompt: Donation self-service wizard (DSW) — **spec kit to create**

**Backlog ID:** DSW (Priority **1.03**). Do **not** implement from this file alone — scaffold a full spec kit first.

## Objective

Author `.specify/specs/donation-self-service-wizard/` with `spec.md`, `plan.md`, `tasks.md` per [.specify/spec-template.md](../spec-template.md) and [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md).

## Product outline (from stakeholder)

- Entry from “donate” → branch: **money | time | space**, and **host a fundraiser?**
- **Money:** tiers (small / medium / large / custom) + **why each tier** → existing donation surfaces → optional **BAR** tying donation narrative to **campaign quest or milestone** + **progress** → return to hub to pick fundraiser / time / space.
- **Time / space:** orientation flow → **BAR** as offer + **marketplace** placement so others can accept.

## Dependencies to cite in spec

- Instance / Stripe / honor flows: `bruised-banana-donation`, `/event/donate`, event donation honor cert patterns.
- Milestones: [BBMT](../specs/bruised-banana-milestone-throughput/spec.md).
- BAR + hand: BUO, GL.

## After spec kit exists

- Register in [BACKLOG.md](../BACKLOG.md) (replace prompt link with `spec.md` path if desired).
- Run `npm run backlog:seed`.

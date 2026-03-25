# Backlog prompt: BB residency marketing & content metabolism (BBM) — **spec kit to create**

**Backlog ID:** BBM (Priority **1.04**). Do **not** implement from this file alone — scaffold a full spec kit first.

## Objective

Author `.specify/specs/bb-residency-marketing-metabolism/` with `spec.md`, `plan.md`, `tasks.md` per [.specify/spec-template.md](../spec-template.md) and [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md).

## Product outline (from stakeholder)

- A **marketing plan** that can **generate and metabolize** game content (**BARs, quests, copy**) in **voice alignment** with messaging that **invites people to the residency**.
- Tie to **Bruised Banana** campaign / house / party dates as appropriate.

## Dependencies to cite in spec

- Execution slice: BBR (EIP, PMEL, campaign surfacing).
- Hub / CHS: [campaign-hub-spoke-landing-architecture](../specs/campaign-hub-spoke-landing-architecture/spec.md) where relevant.
- Narrative quality / feedback: narrative-quality skill, `.feedback` paths if quests ship.

## Verification

- Include a **Verification Quest** section if any player-facing UI ships in v1; otherwise scope v1 as **process + admin artifacts** and document in spec.

## After spec kit exists

- Update [BACKLOG.md](../BACKLOG.md) row BBM to link `spec.md`.
- Run `npm run backlog:seed`.

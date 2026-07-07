# Spec Kit Prompt: The Crossing — CYOA Experience + Steward Dashboard

## Role

You are a Spec Kit agent recreating the returned Claude Design package **"The
Crossing — campaign → capture → steward dashboard"** in the BARS Engine
codebase, using its existing card primitive, tokens, roles lib, and capture
action. The handoff lives at
[.specify/specs/the-crossing-experience/design_handoff/](../specs/the-crossing-experience/design_handoff/)
(README + `design_files/*.dc.html` + `screens/*.png`) — **recreate, do not ship
the HTML**.

## Objective

Implement per
[.specify/specs/the-crossing-experience/spec.md](../specs/the-crossing-experience/spec.md).
Turn "I want to help" into one small concrete **move** that becomes a **BAR** on
a steward's board, and give the steward a real surface to follow up, watch the
car fund fill, mark the car purchased, and broadcast a thank-you that closes the
loop ("a yellow brick is paved").

## Prompt (API-First)

> Implement The Crossing experience per
> `.specify/specs/the-crossing-experience/spec.md`. **API-first**: define the
> server actions and the contribution data shape before UI. Actions:
> `submitTheCrossingMove(formData)`,
> `stewardTransitionContribution({barId,action,message?})`,
> `stewardMarkCarPurchased({campaignRef})`,
> `stewardBroadcastThankYou({campaignRef,message})`. **Reuse `CustomBar`** —
> contribution state (channel, amount, status machine, notes[], notified) lives
> in `contextLines` JSON; **no Prisma migration**. Build phase by phase per
> `plan.md` / `tasks.md`, `npm run build` + `npm run check` at each boundary.

## Requirements

- **Surfaces**: dedicated `src/app/campaign/the-crossing/**` route tree —
  landing (hero + How-To-Play + domain gates + accordion role cards), role
  detail (`role/[roleId]`) with two `CultivationCard` deck cards, capture
  (`move/[roleId]`) + saved confirmation, and an auth-gated steward area
  (`steward/**`: dashboard, contributor follow-up, thank-you broadcast, loop
  closed).
- **Mechanics**: status machine `new → contacted → accepted｜declined`, terminal
  `thanked`; donor submits start `accepted`; broadcast thanks all non-declined;
  fund `raised = 3225 + Σ donor amounts` toward `4800`.
- **Persistence**: reuse `CustomBar` (`campaignRef:'the-crossing'`,
  `evidenceKind:'support_intake'`); campaign state in a singleton state BAR
  (`evidenceKind:'campaign_state'`). **No new tables/columns.**
- **API**: four server actions above (contracts in spec § API Contracts).
- **Verification**: `cert-the-crossing-experience-v1` Twine quest + seed script
  (`seed:cert:the-crossing`), framed toward the barn-raising fundraiser.

## Checklist (API-First Order)

- [ ] Action signatures + `contextLines` shape defined (spec)
- [ ] No Prisma schema change (`npm run check` shows no schema diff)
- [ ] Server actions implemented first, UI wired after
- [ ] `car_person → car_expert` rename with back-compat alias
- [ ] Steward authorization re-checked server-side
- [ ] `npm run build` + `npm run check` — fail-fix
- [ ] Verification quest implemented (do not mark UI complete without it)

## Deliverables

- [ ] `.specify/specs/the-crossing-experience/spec.md` (done)
- [ ] `.specify/specs/the-crossing-experience/plan.md` (done)
- [ ] `.specify/specs/the-crossing-experience/tasks.md` (done)
- [ ] Implementation across the 7 phases in `tasks.md`

## Reference

- Spec: [.specify/specs/the-crossing-experience/spec.md](../specs/the-crossing-experience/spec.md)
- Plan: [.specify/specs/the-crossing-experience/plan.md](../specs/the-crossing-experience/plan.md)
- Tasks: [.specify/specs/the-crossing-experience/tasks.md](../specs/the-crossing-experience/tasks.md)
- Design handoff: [.specify/specs/the-crossing-experience/design_handoff/README.md](../specs/the-crossing-experience/design_handoff/README.md)
- Superseded MVP: [.specify/specs/the-crossing-campaign-landing-page/spec.md](../specs/the-crossing-campaign-landing-page/spec.md)
- Code: `src/lib/the-crossing-support-moves.ts`, `src/actions/the-crossing-support.ts`,
  `src/lib/ui/card-tokens.ts`, `src/components/ui/CultivationCard.tsx`
</content>

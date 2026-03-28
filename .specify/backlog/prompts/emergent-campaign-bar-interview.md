# Backlog prompt: ECI — Emergent campaign from BAR interview

**Backlog ID:** 1.71 · **Spec kit:** [.specify/specs/emergent-campaign-bar-interview/](../specs/emergent-campaign-bar-interview/)

## One-liner

Ship the **Thunder pattern**: interview-by-invite **before** campaign exists → **admin waters** → **child hub + 8 spokes (Create Urgency)** → **parent Bruised Banana bridge** → repeatable templates; later **slots + BAR pool** for player-originated subcampaign ideas.

## Ops + content (shipped slice)

- **Runbook:** [`docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md`](../../../docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md) — backlog map, honest data gap, manual water checklist.
- **Template:** `npx tsx scripts/apply-invite-template.ts --bar-id=<cuid> --template=allyship-thunder` — [`allyship-intake-thunder.template.json`](../../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json).

## Agent instructions

1. Read **spec.md** → **plan.md** → execute **tasks.md** in order.
2. Reconcile with **CSC** (parent/child `campaignRef`) before Prisma.
3. Reuse **EIP** / `event_invite` BAR + `EventInviteStory` for v1 intake unless spec’s open question drives a new type.
4. After schema edits: **`npx prisma migrate dev --name …`**, `npm run check`.
5. Add **verification quest** (cert) before marking Phase C+ UX complete.

## Human context (Thunder)

Friend **Thunder** was fired; steward sends a **BAR invitation** link to a **formal interview** collecting what they want from an **allyship campaign**. The **specific** campaign name/ref is **unknown** until **Bruised Banana admin** reviews answers and **waters** the intake. Spawned experience must feel like **Kotter stage 1 (urgency)** across spokes while staying **connected to the residency**.

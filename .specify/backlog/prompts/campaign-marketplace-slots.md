# Spec Kit Prompt: Campaign marketplace slots & wilderness IA

## Role

You are a Spec Kit agent responsible for integrating **exploration** (hub, map, CYOA — “wilderness”) with **player campaign marketplace slots** (“mall stalls”): BARSeeds and quests discovered in the wild can be **listed** in **scarce slots** (8 base, expensive extension).

## Objective

Implement per [.specify/specs/campaign-marketplace-slots/spec.md](../specs/campaign-marketplace-slots/spec.md). **API-first**: define `listPlayerCampaignSlots`, `attachArtifactToSlot`, `purchaseAdditionalSlot` before marketplace UI. Reconcile [gameboard-campaign-deck](../specs/gameboard-campaign-deck/spec.md) so the **gameboard** is not conflated with **player stalls**.

## Prompt (API-First)

> Implement **Campaign marketplace slots** per `.specify/specs/campaign-marketplace-slots/`. Define server action contracts in spec; add Prisma models + migration; wire **canonical post-discovery CTA** (“Add to your campaign stall” / “List on marketplace”) on Hand + one CYOA path for `bruised-banana`. Ship **system stalls** for empty-mall mitigation. Verification: `cert-campaign-marketplace-slots-v1`, `npm run seed:cert:campaign-marketplace-slots`.

## Requirements

- **Surfaces**: `/campaign/hub`, `/campaign/board`, map, Hand, new `/campaign/marketplace` (or chosen route).
- **Mechanics**: Wild = discovery graph; market = listing graph; 8 slots + paid extension.
- **Persistence**: New or extended models per plan.md Phase B.
- **Copy**: Distinguish **Explore** vs **Publish / List** everywhere primary CTAs conflict.

## Checklist (API-First Order)

- [ ] API contracts implemented and tested
- [ ] UI wired; system stalls seeded
- [ ] `npm run build` and `npm run check` — fail-fix
- [ ] Certification quest steps pass when features land

## Deliverables

- [x] `.specify/specs/campaign-marketplace-slots/spec.md`, `plan.md`, `tasks.md`
- [ ] Implementation per `tasks.md` Phases A–D

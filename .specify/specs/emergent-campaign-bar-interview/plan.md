# Plan: Emergent campaign from BAR interview

## Authority

Implement per [.specify/specs/emergent-campaign-bar-interview/spec.md](./spec.md). Execute [tasks.md](./tasks.md) in order.

## Strategic order

1. **Align ontology** with [campaign-subcampaigns](../campaign-subcampaigns/spec.md) (CSC) — confirm parent `campaignRef`, child naming, `Instance` cardinality for “Support X” under Bruised Banana **before** schema work.
2. **Phase A** — Latent intake persistence + BAR-linked interview submission; minimal **admin list** under existing admin or `/campaign/...` steward route (reuse **EIP** patterns: `CustomBar`, `storyContent` / `EventInviteStory`).
3. **Phase B** — **Water** action: create child campaign + apply **CHS** hub/spoke scaffolding; reuse **seed scripts** (`seed-campaign-portal-adventure`, BB house, or new `seed-emergent-child-campaign.ts`) for **eight spokes** + **period 1 Create Urgency** copy pack.
4. **Phase C** — **COC** surfaces: parent strip on child hub, `CampaignDonateButton` / wizard `ref` for child.
5. **Phase D** — In-app interview entry + **CMS** slot gating + steward approval queue (depends **1.02.2 CMS**, **1.59 CSC** progress).

## File impacts (anticipated)

| Area | Files / systems |
|------|------------------|
| Schema | `prisma/schema.prisma` — latent intake + template link (TBD) |
| Actions | `src/actions/…` — submit, list, water, spawn (new module) |
| Admin / steward UI | `src/app/admin/...` or campaign-scoped page under `ref=bruised-banana` |
| Invite reader | `EventInviteStoryReader` / builder — template `allyship_intake_v1` |
| Hub | `CampaignHubView`, `campaignHubState`, spoke routing per CHS |
| Docs | Cross-link from [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) “Emergent spawn” subsection (optional follow-up) |

## Convergence with CMI

- **Shared:** Interview question model, step wizard shell, BAR seed field hints.
- **Different:** CMI assumes **existing** `campaignRef`; this spec assumes **latent** → **spawn**. Prefer **one** `InterviewTemplate` discriminant (`kind: 'creator_milestone' | 'allyship_intake'`) in a later refactor task—not blocking Phase A if duplicated briefly.

## Verification

- `npm run check`, `npm run build`
- Cert quest seed + manual walk: spec § Verification quest
- Staging: one **Thunder** dry run without production `campaignRef` until water

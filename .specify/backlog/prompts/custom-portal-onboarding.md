# Spec Kit Prompt: Custom Portal Onboarding Flow v0

## Role

You are a Spec Kit agent extending the Bruised Banana onboarding with custom invite-token-based portal entry points. The portal flow must not diverge from the existing actor creation and quest assignment pipeline.

## Objective

Implement per [.specify/specs/custom-portal-onboarding/spec.md](../specs/custom-portal-onboarding/spec.md). **API-first**: define validateInviteToken, beginPortalOnboarding, submitPortalResponses, createActorFromPortal before UI. Spec: [spec.md](../specs/custom-portal-onboarding/spec.md).

## Requirements

- **PortalInvite model**: token, campaignRef, instanceId, inviterId, portalVariant, expiresAt
- **Five-scene flow**: Invitation → Agency style → Issue attention → Current energy → Impact distance
- **campaignState mapping**: archetype_signal → playbookId; interest_domains → campaignDomainPreference
- **createActorFromPortal**: Reuse createCampaignPlayer logic; pass derived campaignState; call assignOrientationThreads
- **No divergence**: Output must be compatible with existing createCampaignPlayer and assignOrientationThreads

## Checklist (API-First Order)

- [ ] API contracts defined in spec and [custom-portal-onboarding-api.md](../../docs/architecture/custom-portal-onboarding-api.md)
- [ ] PortalInvite model; portal-mappings.ts (archetype, interest domain mappings)
- [ ] portal-onboarding.ts: validateInviteToken, beginPortalOnboarding, submitPortalResponses, createActorFromPortal
- [ ] /portal/[token] route; Scene components
- [ ] PortalAuthForm; createActorFromPortal integration
- [ ] Verification quest cert-custom-portal-onboarding-v1
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/custom-portal-onboarding/spec.md
- [ ] .specify/specs/custom-portal-onboarding/plan.md
- [ ] .specify/specs/custom-portal-onboarding/tasks.md
- [ ] docs/architecture/custom-portal-onboarding-api.md
- [ ] src/actions/portal-onboarding.ts
- [ ] src/lib/portal-mappings.ts
- [ ] src/app/portal/[token]/page.tsx
- [ ] src/components/portal/* (Scene 1–5, AuthForm)
- [ ] Schema: PortalInvite
- [ ] Verification quest seed

## Reference

- Spec: [.specify/specs/custom-portal-onboarding/spec.md](../specs/custom-portal-onboarding/spec.md)
- Plan: [.specify/specs/custom-portal-onboarding/plan.md](../specs/custom-portal-onboarding/plan.md)
- API: [docs/architecture/custom-portal-onboarding-api.md](../../docs/architecture/custom-portal-onboarding-api.md)
- createCampaignPlayer: [src/app/campaign/actions/campaign.ts](../../src/app/campaign/actions/campaign.ts)
- assignOrientationThreads: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)

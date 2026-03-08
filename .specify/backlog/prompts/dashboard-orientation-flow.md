# Spec Kit Prompt: Dashboard-First Orientation Flow

## Role

You are a Spec Kit agent implementing configurable post-signup redirect so players land on the dashboard instead of conclave. Orientation quests remain required for users in campaign; completing onboarding signals "in campaign."

## Objective

Implement the Dashboard-First Orientation Flow per [.specify/specs/dashboard-orientation-flow/spec.md](../specs/dashboard-orientation-flow/spec.md). **API-first**: define `getPostSignupRedirect()` and redirect logic before UI changes. Conclave/onboarding is deprecated for new campaigns (was for Party); all campaigns have onboarding quests (generated or admin-created). Bruised Banana is the MVP prototype.

## Prompt (API-First)

> Implement Dashboard-First Orientation Flow per [.specify/specs/dashboard-orientation-flow/spec.md](../specs/dashboard-orientation-flow/spec.md). **API-first**: (1) Add `postSignupRedirect` to AppConfig, (2) implement `getPostSignupRedirect(): Promise<'conclave' | 'dashboard'>`, (3) update createCampaignPlayer and createGuidedPlayer to use it. When `'dashboard'`, redirect to `/?focusQuest={questId}` or `/`. When `'conclave'`, keep current redirect to `/conclave/onboarding`. Default `'dashboard'`. Add cert-dashboard-orientation-flow-v1 verification quest. Spec: [path].

## Requirements

- **Surfaces**: Campaign signup (CampaignAuthForm), Guided signup (conclave), Login
- **Mechanics**: AppConfig.postSignupRedirect drives redirect target after signup
- **Persistence**: AppConfig.postSignupRedirect (String?, 'conclave' | 'dashboard')
- **API**: getPostSignupRedirect() server/helper; redirect logic in createCampaignPlayer, createGuidedPlayer
- **Verification**: cert-dashboard-orientation-flow-v1 — sign up via CYOA → dashboard → orientation quests → complete

## Checklist (API-First Order)

- [ ] Add postSignupRedirect to AppConfig schema
- [ ] Run `npm run db:sync`
- [ ] Implement getPostSignupRedirect()
- [ ] Update createCampaignPlayer redirect logic
- [ ] Update createGuidedPlayer redirect logic
- [ ] Add verification quest cert-dashboard-orientation-flow-v1
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] prisma/schema.prisma (postSignupRedirect)
- [ ] src/actions/config.ts or equivalent (getPostSignupRedirect)
- [ ] src/app/campaign/actions/campaign.ts (redirect logic)
- [ ] src/actions/conclave.ts (redirect logic)
- [ ] Verification quest seed

## References

- Spec: [.specify/specs/dashboard-orientation-flow/spec.md](../specs/dashboard-orientation-flow/spec.md)
- Plan: [.specify/specs/dashboard-orientation-flow/plan.md](../specs/dashboard-orientation-flow/plan.md)
- Tasks: [.specify/specs/dashboard-orientation-flow/tasks.md](../specs/dashboard-orientation-flow/tasks.md)
- Related: [bruised-banana-onboarding-flow](../specs/bruised-banana-onboarding-flow/spec.md), [cyoa-onboarding-reveal](../specs/cyoa-onboarding-reveal/spec.md), [game-master-face-sentences](../specs/game-master-face-sentences/spec.md)

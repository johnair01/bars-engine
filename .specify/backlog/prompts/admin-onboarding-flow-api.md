# Prompt: Admin Onboarding Flow API

**Use this prompt when implementing the API-first onboarding flow structure for the admin page.**

## Prompt text

> Implement the Admin Onboarding Flow API per [.specify/specs/admin-onboarding-flow-api/spec.md](../specs/admin-onboarding-flow-api/spec.md). **API-first**: define `GET /api/admin/onboarding/flow?campaign=bruised-banana` contract and implement route before UI. Read `content/twine/onboarding/bruised-banana-onboarding-draft.twee`, call `translateTweeToFlow()`, return FlowOutput JSON. Create client component `OnboardingFlowTemplate` that fetches the API and renders the template structure on `/admin/onboarding`. Add verification quest `cert-admin-onboarding-flow-api-v1`. Run `npm run build` and `npm run check`. Spec: [path].

## Checklist (API-First Order)

- [ ] API route `GET /api/admin/onboarding/flow` implemented (campaign param, 400/500 handling)
- [ ] Client component OnboardingFlowTemplate fetches and renders
- [ ] Admin onboarding page includes template section
- [ ] Verification quest added to seed-cyoa-certification-quests.ts
- [ ] npm run build and npm run check pass

## Reference

- Spec: [.specify/specs/admin-onboarding-flow-api/spec.md](../specs/admin-onboarding-flow-api/spec.md)
- Plan: [.specify/specs/admin-onboarding-flow-api/plan.md](../specs/admin-onboarding-flow-api/plan.md)
- Tasks: [.specify/specs/admin-onboarding-flow-api/tasks.md](../specs/admin-onboarding-flow-api/tasks.md)

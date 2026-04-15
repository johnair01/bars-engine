# Tasks: Custom Portal Onboarding Flow v0

## Phase 1 — Schema + Validation

- [ ] Add PortalInvite model to prisma/schema.prisma (token, campaignRef, instanceId, inviterId, portalVariant, defaultPath, expiresAt)
- [ ] Add Instance and Player relations; run `npm run db:sync`
- [ ] Create src/actions/portal-onboarding.ts
- [ ] Implement validateInviteToken(token): Promise<{ valid: true; invite } | { valid: false; error }>
- [ ] Create src/lib/portal-mappings.ts: archetypeSignalToPlaybookName, interestDomainsToAllyship
- [ ] Seed script or admin action to create PortalInvite (e.g. for bruised-banana)
- [ ] Run `npm run build` and `npm run check`

## Phase 2 — Five-Scene Flow

- [ ] Create src/app/portal/[token]/page.tsx
- [ ] Validate token on load; redirect or error if invalid/expired
- [ ] Create PortalScene1 (Invitation — Begin)
- [ ] Create PortalScene2 (Agency style — archetype_signal)
- [ ] Create PortalScene3 (Issue attention — interest_domains)
- [ ] Create PortalScene4 (Current energy — preferred_move_state)
- [ ] Create PortalScene5 (Impact distance — impact_stage)
- [ ] Implement beginPortalOnboarding, submitPortalResponses
- [ ] Session storage for responses (cookie or server)
- [ ] Scene navigation (next/back)
- [ ] Run `npm run build` and `npm run check`

## Phase 3 — Actor Creation

- [ ] Implement createActorFromPortal(token, identity)
- [ ] Map portal responses to campaignState (playbookId, campaignDomainPreference, state.preferredMove, state.impactStage)
- [ ] Call createCampaignPlayer logic (or inline) with derived campaignState
- [ ] Call assignOrientationThreads
- [ ] Create PortalAuthForm (contact, password); submit to createActorFromPortal
- [ ] Redirect to dashboard on success
- [ ] Store campaignRef and invitedBy in storyProgress when inviterId present
- [ ] Run `npm run build` and `npm run check`

## Phase 4 — Polish

- [ ] Expired token: clear error message
- [ ] Invalid token: 404 or "Invite not found"
- [ ] Verification quest cert-custom-portal-onboarding-v1
- [ ] Run `npm run build` and `npm run check`

## Verification

- [ ] Manual: Create invite → complete 5 scenes → sign up → dashboard with orientation
- [ ] Manual: Expired invite shows error
- [ ] Manual: Invalid token shows error

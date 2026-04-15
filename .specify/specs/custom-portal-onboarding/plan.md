# Plan: Custom Portal Onboarding Flow v0

## Implementation Phases

1. **Phase 1 — Schema + validation**: PortalInvite model; validateInviteToken; seed/admin for creating invites
2. **Phase 2 — Five-scene flow**: `/portal/[token]` route; Scene components; session storage for responses
3. **Phase 3 — Actor creation**: createActorFromPortal; campaignState mapping; reuse createCampaignPlayer
4. **Phase 4 — Polish**: Error states; expired token; dashboard entry

## Key Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add PortalInvite model |
| `src/actions/portal-onboarding.ts` | New: validateInviteToken, beginPortalOnboarding, submitPortalResponses, createActorFromPortal |
| `src/app/portal/[token]/page.tsx` | New: Portal flow; validate token; render current scene |
| `src/components/portal/PortalScene*.tsx` | New: Scene 1–5 components |
| `src/components/portal/PortalAuthForm.tsx` | New: Auth form; calls createActorFromPortal |
| `src/lib/portal-mappings.ts` | New: archetype_signal → playbook, interest_domains → allyship |

## Integration Points

### createCampaignPlayer

- createActorFromPortal builds campaignState from portal responses
- Calls createCampaignPlayer with identity + campaignState (or inlines the logic to avoid form-data)
- Alternatively: create a variant createCampaignPlayerFromPortal(identity, campaignState) that skips form parsing

### assignOrientationThreads

- Called after player creation (same as createCampaignPlayer)
- Reads storyProgress.state (campaignDomainPreference, playbookId, etc.)

### Session Storage

- Use cookies (encrypted) or server-side session store
- Key: `portal_session_{token}` or similar
- Value: { responses: PortalResponses, scene: number }

## Route Structure

```
/portal/[token]
  - GET: Validate token; render current scene
  - Form submits: submitPortalResponses (Server Action)
  - After Scene 5: Show auth form
  - Auth submit: createActorFromPortal (Server Action)
```

## Verification Quest

- **ID**: cert-custom-portal-onboarding-v1
- **Steps**: (1) Create portal invite (admin or seed). (2) Visit /portal/{token}. (3) Complete 5 scenes. (4) Sign up. (5) Land on dashboard with orientation quests.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

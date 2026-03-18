# Plan: Player-Led Invitation BAR

## Summary

Add schema (forgerId, invitationTargetType, invitationTargetId on Invite; invitedByPlayerId on Player), forge action, invite page pre-fill, and quest integration for Invite an Ally.

## Implementation Order

### Phase 2: Schema + forge + pre-fill

1. **prisma/schema.prisma**
   - Invite: forgerId (String?), invitationTargetType (String?), invitationTargetId (String?)
   - Invite: forger Player? relation
   - Player: invitedByPlayerId (String?), invitedBy Player? relation
   - Run `npm run db:sync`

2. **src/actions/forge-invitation-bar.ts**
   - forgeInvitationBar(formData): targetType, targetId required; creates Invite + CustomBar; returns { barId, token, inviteUrl, claimUrl }
   - Valid targetType: nation, school (face key), sect (defer validation for sect)
   - For nation: targetId = nationId; for school: targetId = face key (shaman, challenger, etc.)

3. **src/app/invite/[token]/page.tsx**
   - Fetch invite with forger, invitationTargetType, invitationTargetId
   - Pass prefill: nationId, archetypeId (school maps to archetype preference or we use a default), or derive from forger
   - For nation target: prefill nationId = invitationTargetId
   - For school target: no direct archetype mapping; could prefill campaignDomainPreference or leave for orientation

4. **src/app/invite/[token]/InviteSignupForm.tsx**
   - Accept prefillNationId, prefillArchetypeId as props; use as defaultValue for selects

5. **src/actions/conclave.ts createCharacter**
   - When invite has forgerId, set Player.invitedByPlayerId = invite.forgerId

### Phase 3: Quest integration

6. **Forge UI entry point**
   - Create /hand/forge-invitation or modal/page for forging
   - Or: add to dashboard / hand when player completes Invite an Ally

7. **processCompletionEffects**
   - When completionType from Strengthen = 'invite' or quest = starter-invite-ally: offer forge or redirect to forge page

8. **Strengthen END_INVITE / Invite an Ally**
   - completionEffects: add effect that opens forge flow or creates BAR

## File Impacts

| Action | File |
|--------|------|
| Edit | prisma/schema.prisma |
| Create | src/actions/forge-invitation-bar.ts |
| Edit | src/app/invite/[token]/page.tsx |
| Edit | src/app/invite/[token]/InviteSignupForm.tsx |
| Edit | src/actions/conclave.ts |
| Create | src/app/hand/forge-invitation/page.tsx (or similar) |
| Edit | src/actions/quest-engine.ts |
| Edit | scripts/seed-onboarding-thread.ts (completionEffects) |

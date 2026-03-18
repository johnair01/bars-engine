# Tasks: Player-Led Invitation BAR

## Phase 2: Schema + forge + pre-fill

- [x] 2.1 Add forgerId, invitationTargetType, invitationTargetId to Invite; invitedByPlayerId to Player
- [x] 2.2 Run db:sync
- [x] 2.3 Create forgeInvitationBar action
- [x] 2.4 Create forge-invitation page (or modal)
- [x] 2.5 Invite page: fetch invite with forger/target; pass prefill to form
- [x] 2.6 InviteSignupForm: accept prefill props
- [x] 2.7 createCharacter: set invitedByPlayerId when invite has forgerId

## Phase 3: Quest integration

- [x] 3.1 Strengthen END_INVITE: strengthenResidency `invite` branch now calls _forgeInvitationBarInTx
- [x] 3.2 forgeInvitationBar effect type added — attach to Invite an Ally quest completionEffects JSON when quest is seeded
- [x] 3.3 processCompletionEffects: forgeInvitationBar case implemented; _forgeInvitationBarInTx helper shared

## Phase 4

- [x] 4.1 "Invited by X" UI — invite page shows forger name in header; dashboard shows "Invited by [Name]" under player contact
- [ ] 4.2 Sect support — define Sect model or reuse gameMasterFace; validate sect targetId in forgeInvitationBar
- [ ] 4.3 Analytics — admin view of invitation tree / conversion rates

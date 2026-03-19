# Tasks: Campaign Role Invitation via BAR

## Phase 1: Schema + Core Flow

- [ ] **1.1** Add `barId` (String?, unique) to CampaignInvitation in prisma/schema.prisma
  - Add relation: bar CustomBar? @relation(fields: [barId], references: [id], onDelete: SetNull)
  - Add CampaignInvitation? relation to CustomBar (one BAR can carry one invitation)
- [ ] **1.2** Run `npm run db:sync`
- [ ] **1.3** Create migration: `npx prisma migrate dev --name add_campaign_invitation_bar_id`
- [ ] **1.4** Create `createCampaignRoleInvitation` server action
  - Params: instanceId, roleKey, targetPlayerId, messageText?, barId?
  - Create BAR if no barId; create CampaignInvitation with barId; create BarShare to targetPlayerId
  - Return { barId, invitationId }
- [ ] **1.5** Create `acceptCampaignRoleInvitation` server action
  - Validate invitation, currentUser = targetActorId
  - If instance is parent (no parentInstanceId): create owner on parent, steward on each child
  - If instance is sub-campaign: create owner on that instance only
  - Update CampaignInvitation status = accepted
- [ ] **1.6** Create `declineCampaignRoleInvitation` server action
  - Validate; update status = declined

## Phase 2: Campaign Admin UI

- [ ] **2.1** Add "Invite to role" button to Campaign Admin (per instance or dashboard)
- [ ] **2.2** Create InviteToRoleModal or form component
  - Instance select (or pre-filled from context)
  - Role select: owner, steward, contributor
  - Recipient select: player search by name/email
  - Message textarea (optional)
- [ ] **2.3** Wire form to createCampaignRoleInvitation
  - Success: show "Invitation BAR sent to [name]"
  - Error: display error

## Phase 3: BAR Detail Integration

- [ ] **3.1** BAR detail: fetch CampaignInvitation where barId = bar.id and targetActorId = currentUser
- [ ] **3.2** When invitation exists and status = sent: render "You're invited to be [role] in [instance name]" with Accept/Decline
- [ ] **3.3** Accept button: call acceptCampaignRoleInvitation; redirect on success
- [ ] **3.4** Decline button: call declineCampaignRoleInvitation; update UI

## Verification

- [ ] Parent accept creates owner + steward on children
- [ ] Sub-campaign accept creates owner only
- [ ] Campaign Admin "Invite to role" works
- [ ] BAR detail shows Accept/Decline for target user
- [ ] npm run build and npm run check pass

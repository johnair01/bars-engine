# Campaign Role Invitation via BAR — Implementation Plan

**Spec**: [spec.md](spec.md)
**Status**: Ready for Phase 1

---

## Phase 1 — Schema + Core Flow

### 1.1 Schema changes

Add to `model CampaignInvitation` in `prisma/schema.prisma`:

```prisma
barId  String?  @unique  // when set, this invitation is delivered via this BAR

bar    CustomBar? @relation(fields: [barId], references: [id], onDelete: SetNull)
```

Add to `model CustomBar` (or verify relation name):

```prisma
campaignInvitation CampaignInvitation?  // one BAR can carry one invitation
```

Run `npm run db:sync`. Create migration: `npx prisma migrate dev --name add_campaign_invitation_bar_id`.

**Note**: targetActorId and createdByActorId are Player ids in this codebase. No schema change needed if they already store player IDs.

### 1.2 Server actions

**createCampaignRoleInvitation**

- Input: instanceId, roleKey (owner|steward|contributor), targetPlayerId, messageText?, barId?
- If no barId: create CustomBar with type 'bar', title "Invitation to [instance name]", description from messageText
- Create CampaignInvitation: instanceId, targetActorId=targetPlayerId, createdByActorId=currentUser, invitedRole=roleKey, barId, status='sent', invitationType='campaign_collaborator' or new type 'role_invitation'
- Create BarShare from currentUser to targetPlayerId with barId
- Return { barId, invitationId, shareId }

**acceptCampaignRoleInvitation**

- Input: invitationId
- Validate: invitation exists, status=sent, currentUser = targetActorId
- Fetch instance; check if it has children (parentInstanceId is null and instance has childInstances)
- If parent: create InstanceMembership owner for parent; for each child, create InstanceMembership steward
- If sub-campaign (has parent) or leaf: create InstanceMembership owner for that instance only
- Update CampaignInvitation: status='accepted', acceptedRole=invitedRole, respondedAt=now
- Revalidate paths
- Return { success: true, redirectTo: '/admin/campaigns' }

**declineCampaignRoleInvitation**

- Input: invitationId
- Validate: invitation exists, status=sent, currentUser = targetActorId
- Update status='declined', respondedAt=now
- Return { success: true }

### 1.3 Parent/child logic

- Instance is **parent** when `parentInstanceId` is null (top-level)
- Instance has **children** when `childInstances` exists (instances where parentInstanceId = this.id)
- On accept parent: create owner for parent; for each child, upsert InstanceMembership with roleKey='steward'
- On accept sub-campaign: create owner for that instance only

---

## Phase 2 — Campaign Admin UI

### 2.1 Invite to role entry point

- Add "Invite to role" button/link on Campaign Admin dashboard (per instance or global)
- Opens modal or navigates to form: instance select, role select (owner/steward/contributor), recipient select (player search), message textarea
- Recipient select: search players by name or email; list recent players; or select from InstanceMembership (existing members)

### 2.2 Form submission

- Call createCampaignRoleInvitation with form data
- On success: "Invitation BAR sent to [recipient name]. They can accept from their Inspirations."
- On error: display error message

---

## Phase 3 — BAR Detail Integration

### 3.1 BAR detail page

- When fetching BAR, check if CampaignInvitation exists with barId = this BAR and targetActorId = currentUser
- If yes: render invitation block — "You're invited to be [role] in [instance name]" with Accept and Decline buttons

### 3.2 Accept/Decline handlers

- Accept: call acceptCampaignRoleInvitation(invitationId); on success redirect to /admin/campaigns or /
- Decline: call declineCampaignRoleInvitation(invitationId); update local state to hide buttons, show "Declined"

### 3.3 BarShare vs BarShareExternal

- In-app: BarShare delivers BAR to recipient; they see it at /bars (Received) and /bars/[id]
- External: BarShareExternal with token; recipient claims at /bar/share/[token]; if logged in and target, show Accept/Decline on BAR detail after claim

---

## File Impact Summary

| Area | Files |
|------|-------|
| Schema | prisma/schema.prisma |
| Actions | src/actions/campaign-invitation.ts (new) or extend invitations.ts |
| Campaign Admin | src/app/admin/campaigns/ (InviteToRoleModal or similar) |
| BAR detail | src/app/bars/[id]/BarDetailClient.tsx, page.tsx |
| Types | Ensure CampaignInvitation includes bar relation |

---

## Verification

- [ ] CampaignInvitation has barId; migration applied
- [ ] createCampaignRoleInvitation creates BAR + CampaignInvitation + BarShare
- [ ] acceptCampaignRoleInvitation creates InstanceMembership(s) correctly for parent vs sub-campaign
- [ ] Parent accept creates steward memberships on children
- [ ] Sub-campaign accept creates owner on that instance only
- [ ] Campaign Admin has "Invite to role" and form works
- [ ] BAR detail shows Accept/Decline when user is target
- [ ] Accept and Decline update state correctly
- [ ] npm run build and npm run check pass

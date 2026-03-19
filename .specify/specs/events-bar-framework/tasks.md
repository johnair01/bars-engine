# Tasks: Events BAR Framework

## Phase 1: Event Invites via BAR

- [x] Add eventArtifactId to CampaignInvitation schema + migration
- [x] Create createEventInvitation action (BAR, CampaignInvitation, BarShare, EventInvite, EventParticipant)
- [x] Create acceptEventInvitation, declineEventInvitation actions
- [x] Update getCampaignInvitationForBar to include eventArtifact
- [x] Update CampaignInvitationAccept: handle event_participant, call accept/decline event actions
- [x] Add listEventArtifactsForInstance action
- [x] Add InviteToEventModal, InviteToEventButton
- [x] Wire "Invite to event" on event page (admin only)

## Phase 2: Unify EventArtifact ↔ Instance

- [x] Add EventArtifact.instanceId FK (optional)
- [x] Instance → EventArtifacts: listEventArtifactsForInstance (instanceId or campaign.instanceId)
- [x] Event page: show Instance + EventArtifacts (Upcoming events section)
- [x] Seed: April 4 dance party on BB-BDAY-001 — `npm run seed:event-april4-dance` (after `seed:party`). Wendell + JJ hosts; nested pre-production EventArtifacts (ops, music, decor).

## Phase 3: Pre-Production Sub-Campaigns

- [x] Child instances for BB-BDAY (BB-BANANA, BB-GRILL, BB-OPS, etc.)
- [x] QuestThread per child (QuestThread.instanceId links to child Instance)
- [x] Admin UI: pre-production crews as child instances

## Phase 4: Event Venue (Gather Clone)

- [x] Instance.spatialMapId (exists)
- [x] "Enter the space" from event page (`getWorldVenueEntryForInstance` → `/world/...`)
- [x] PopSpace evaluation (`POPSPACE_EVALUATION.md`)

## Phase 5: Nested pre-production + OSS (partial)

- [x] EventArtifact parent/child (`parentEventArtifactId`); invites to child crews → `functionalRole: preproduction` on accept
- [x] Event hosts (`EventCampaign.hostActorIds`) can send event invitations
- [x] `/event` tree: main event + pre-production rows; invite modal groups main vs crews
- [ ] Capacity, check-in, recurrence, calendar sync (still deferred)

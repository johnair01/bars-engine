# Spec: Events BAR Framework Integration

## Purpose

Fold event management into the BAR framework: event invites via BAR, EventArtifact ↔ Instance linkage, pre-production sub-campaigns, and event venue (Gather-style spatial).

## Status

- **Phase 1** (Event Invites via BAR): Implemented
- **Phase 2** (EventArtifact ↔ Instance): Implemented (April 5th EventArtifact seed remains backlog)
- **Phase 3** (Pre-production sub-campaigns): Implemented
- **Phase 4** (Event venue entry): Implemented — see `POPSPACE_EVALUATION.md`
- **Phase 5**: Deferred

## Phase 4: Event Venue (Gather-style)

### User stories

- **As a participant**, I can open the event page and **Enter the space** to join the instance’s spatial map (first room), consistent with `/world/[instanceSlug]/[roomSlug]`.
- **As an admin**, I see guidance when no spatial map is linked so I can attach one in Admin → Instances.

### Acceptance criteria

- [x] Active instance with `spatialMap` and at least one room shows **Enter the space** on `/event`
- [x] Link resolves via `getWorldVenueEntryForInstance`
- [x] PopSpace / vendor path documented for future decision (`POPSPACE_EVALUATION.md`)

## Phase 1: Event Invites via BAR (Done)

### User Stories

- **As an admin**, I can invite guests to an event via BAR from the event page, so they receive an RSVP-able invitation in their Inspirations.
- **As a recipient**, I see "You're invited to [Event] on [date]" on the BAR detail page and can RSVP Going or Decline.

### Acceptance Criteria

- [x] CampaignInvitation has `eventArtifactId` (optional FK)
- [x] `createEventInvitation` creates BAR + CampaignInvitation + BarShare + EventInvite + EventParticipant
- [x] BAR detail shows event-specific content when `invitationType === 'event_participant'`
- [x] Accept (RSVP) updates EventParticipant (RSVP_yes), EventInvite (accepted)
- [x] Decline updates EventParticipant (declined), EventInvite (declined)
- [x] "Invite to event" button on event page (admin only) opens modal

### Reference

- Plan: [.cursor/plans/events_bar_framework_integration_6027208c.plan.md](../../.cursor/plans/events_bar_framework_integration_6027208c.plan.md)
- Strand consult: [STRAND_CONSULT.md](./STRAND_CONSULT.md)
- Phone-first: [PHONE_FIRST_IMPLEMENTATION_PLAN.md](./PHONE_FIRST_IMPLEMENTATION_PLAN.md)

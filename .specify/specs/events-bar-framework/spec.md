# Spec: Events BAR Framework Integration

## Purpose

Fold event management into the BAR framework: event invites via BAR, EventArtifact ↔ Instance linkage, pre-production sub-campaigns, and event venue (Gather-style spatial).

## Status

- **Phase 1** (Event Invites via BAR): Implemented
- **Phase 2** (EventArtifact ↔ Instance): Implemented (April 5th EventArtifact seed remains backlog)
- **Phase 3** (Pre-production sub-campaigns): Implemented
- **Phase 4** (Event venue entry): Implemented — see `POPSPACE_EVALUATION.md`
- **Phase 5** (partial): Nested pre-production events + host invites; in-app **Edit schedule & capacity** for `EventArtifact` (hosts/admins).
- **Phase 6** (partial): **Capacity** (optional max + RSVP counts + enforce on accept), **check-in** (hosts → `attended`), **calendar** (.ics download for hosts/participants). **Recurrence** (`recurrenceRule` column only; UI later).

## Phase 6 — Capacity, check-in, calendar

- **As a host**, I see **N / M going** when capacity is set, can edit capacity in the event editor, and RSVPs cannot exceed capacity when someone accepts an invitation.
- **As a host**, I can expand **Guests & check-in**, see participants, and mark **Check in** for those who RSVPed.
- **As a host or invited participant**, I can download **Add to calendar (.ics)** for an event that has a start time (login required; access same as visibility rules in action).
- **Recurrence:** `recurrenceRule` reserved in DB; no product UI in Phase 6.

## Phase 5 — Edit event schedule (in-app)

- **As a campaign host or steward**, I can open **Edit time** on `/event` for any listed event (including pre-production rows) and set start, optional end, and optional IANA timezone; saves to `EventArtifact` and refreshes the page.

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

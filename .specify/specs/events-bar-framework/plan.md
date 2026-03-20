# Plan: Events BAR Framework

## Phase 6 — Event operations (capacity, check-in, calendar)

**Goal:** Close the loop from “invite + RSVP” to **operational** event tooling without building a full ticket platform.

### Order

1. Schema: `EventArtifact.capacity`, `EventArtifact.recurrenceRule` (DB only for RRULE until needed).
2. List + edit: RSVPs counted; hosts edit capacity in existing schedule modal; enforce capacity on **accept** invitation.
3. Check-in: hosts list participants, **Check in** → `participantState: attended`.
4. Calendar: authenticated `GET /api/events/[eventId]/ics` (host or participant).
5. Recurrence UI / RRULE parsing — deferred.

### Files (reference)

- `prisma/schema.prisma`, migration `20260420120000_event_artifact_phase6_capacity`
- `src/actions/campaign-invitation.ts` — counts, capacity on update, accept guard, participant list, check-in, `playerCanAccessEventCalendar`
- `src/lib/build-event-ics.ts`, `src/app/api/events/[eventId]/ics/route.ts`
- `src/app/event/*` — capacity line, `.ics` link, `EventGuestsPanel`

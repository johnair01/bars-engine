# Spec: Event crew surface (`/event`)

## Purpose

Surface **pre-production / crew** `EventArtifact` rows (those with `parentEventArtifactId` set) in a **dedicated, scannable section** on `/event`, grouped by parent main event—without replacing the existing nested list under each root event.

**Practice:** Deftness — reuse `listEventArtifactsForInstance` data already loaded on the page; no new API or schema.

## User stories

- **As a guest or member**, I can see **all crew / pre-production gatherings** for this campaign instance in one place with **which main night** each supports.
- **As a host**, I can use the same **invite / calendar / edit** affordances as main events where permissions allow.

## Acceptance

- [ ] When at least one child `EventArtifact` exists for the active instance, `/event` shows an **Event crews** section with title, schedule, parent main-event label, RSVP hint, `.ics` when logged in.
- [ ] When no child events exist, the section is **omitted** (no empty shell).
- [ ] Styling matches adjacent campaign sections (amber / zinc palette).

## References

- [BRUISED_BANANA_EVENT_SYSTEM_AUDIT.md](../../../docs/BRUISED_BANANA_EVENT_SYSTEM_AUDIT.md) § P5

# Runbook: April 4 Bruised Banana Birthday Dance

**Backlog:** `BB-APR4-DANCE` in [.specify/backlog/BACKLOG.md](../../.specify/backlog/BACKLOG.md)  
**Seed script:** [`scripts/seed-april4-dance-party.ts`](../../scripts/seed-april4-dance-party.ts)

---

## Prerequisites

1. **Instance** `BB-BDAY-001` exists in the target database (e.g. from `npm run seed:party` or your instance seed).
2. **Players** for hosts — script resolves **Wendell** and **JJ** by name (case-insensitive) into `EventCampaign.hostActorIds`. If missing, hosts are empty; fix by renaming players or editing the campaign row after seed.
3. **Production** — run migrations before seed; use the same `DATABASE_URL` as the app.

---

## Seed (idempotent)

```bash
npm run seed:event-april4-dance
```

Equivalent: `npx tsx scripts/seed-april4-dance-party.ts`

---

## What gets created

| Item | ID (stable in script) |
|------|------------------------|
| EventCampaign | `EC-BB-APRIL-DANCE-2026` |
| Main event | `EVT-BB-DANCE-2026-04-04` |
| Pre-production children | `EVT-BB-DANCE-2026-PRE-OPS`, `PRE-MUSIC`, `PRE-DECOR` |

Times default to **April 4, 2026** evening **America/Los_Angeles** (adjust in DB if needed).

---

## Inviting guests (in-app)

1. **Hosts / admins** use the **Invite to event** flow (see [`createEventInvitation`](../../src/actions/campaign-invitation.ts)): recipient must resolve to a **Player** (email, name, or id per your resolver).
2. **Accept** → `acceptEventInvitation` → RSVP; **nested** child events set `functionalRole: preproduction` on accept.  
3. **Calendar:** participants with access can download **ICS** from `/api/events/[eventId]/ics` (login required).

**Not the same as:** “Invite friends” on `/event` copying `/event?ref=bruised-banana` — that is **campaign onboarding**, not RSVP to this dance.

---

## External comms (outside the app)

For people who will not log in: send **date, time, address, dress code, link** via your normal channels (email/SMS). Optionally include the **public home** or **/event** URL for context; **RSVP in-app** still requires accounts.

---

## Quick verification

- [ ] `EventCampaign` row exists in admin or DB
- [ ] Main `EventArtifact` shows correct `startTime` / `endTime` / timezone
- [ ] Host player ids present on `hostActorIds` JSON
- [ ] Test invite to a dev player and accept on `/bars/[id]` invitation UI

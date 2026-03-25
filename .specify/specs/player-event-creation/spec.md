# Spec: Player / campaign-owner event creation (in-app)

## Purpose

Ship **authorized, in-app creation** of `EventCampaign` and `EventArtifact` rows so that events defined by hosts and stewards **use the same structures** as developer seeds and appear on **`/event`** (invites, RSVP, `.ics`, crew surface) without a separate “fast path” that bypasses the model.

**Depends on:** [event-campaign-engine](../event-campaign-engine/spec.md) (existing server actions and schema); permission patterns in [`src/actions/campaign-invitation.ts`](../../../src/actions/campaign-invitation.ts) (`canInviteToEventArtifact`, instance hosts).

---

## Six Game Master analysis

Structured read from each face on *what must be true* for this feature to serve the whole (I/We/It/Its) stack.

### Shaman (reading / ritual)

People need to feel that **creating an event in the app is the real event**, not a fake form. The UI should make the **link to the campaign and the night** obvious: title, when, where, and (if applicable) **“this supports [main event]”** for crew rows. Empty states and success states should **confirm** the event will show on the campaign page and support invites—reducing the “did it sync?” anxiety that comes from copy-only or script-only workflows.

### Regent (governance / stewardship)

**Who may create** must be explicit: instance **admins/stewards** and **`EventCampaign` hosts** (`hostActorIds`), aligned with who may already **invite** (`canInviteToAnyEventOnInstance` / `canInviteToEventArtifact`). Creation must **not** be open to any logged-in player with a guessed `campaignId`. **Auditability:** `createdByActorId` already exists; creation actions should **revalidate** the right paths and optionally log (or surface) **campaign ↔ instance** attachment so production doesn’t sprawl orphan campaigns.

### Challenger (adversarial / edge cases)

- **IDOR:** `createEventArtifact` must verify the player may act on **that** `campaignId` (and that campaign’s `instanceId` matches the intended residency when instance-scoped).
- **Wrong instance:** Block or fix-up so artifacts aren’t invisible on `/event` (listing joins instance via `event_artifacts.instance_id` OR `event_campaigns.instanceId`—both should be consistent after create).
- **Spam / abuse:** Rate limits or role gates; optional “draft” vs “scheduled” promotion.
- **Partial failure:** If “main + pre-prod bundle” is offered, **transaction** or clear rollback so users don’t get half-created trees.

### Architect (structure / implementation)

- **Single blessed path:** UI and seeds should prefer the same **server actions** (`createEventCampaign`, `createEventArtifact`, plus a new **orchestrated** action if needed) rather than duplicate Prisma writes.
- **Set `instanceId`:** On create, align `EventCampaign.instanceId` and preferably **`EventArtifact.instanceId`** when creating for a known active instance (denormalized listing + clarity).
- **Optional bundle:** `createMainEventWithPreprodArtifacts(instanceId, campaignId | createCampaignInput, mainEventInput, preprodTemplate[])` in one transaction.
- **`revalidatePath('/event')`** (and related) after mutations.

### Diplomat (language / accessibility)

- Labels for **host** vs **admin** vs **player**: e.g. “Add a gathering” for hosts, not “Admin seed.”
- **Progressive disclosure:** Simple path (one main event); advanced path (crew slots, templates).
- **Community allergy to AI:** Copy is **transparent** about what the system stores (schedule, invites)—no faux-magic.

### Sage (integration / meta)

- **Connects** event-campaign-engine, `/event` listing, invite flows, crew surface, and **runbooks/seeds** into one story: “data created in-app ≡ data created by script.”
- **Non-goals for v1** stay explicit (e.g. full RRULE UI, public discovery) so scope doesn’t balloon.

---

## User stories

1. **As a campaign host or instance steward**, I can create a **main** scheduled `EventArtifact` for the active residency so it appears under **Events on this campaign** on `/event`.
2. **As a host**, I can optionally create **pre-production / crew** child events **at the same time** as the main event (or in a second step), with `parentEventArtifactId` set, so they appear in the nested list and **Event crews** surface.
3. **As an admin**, I can create or attach an `EventCampaign` to the instance when none exists, without using raw SQL or ad-hoc scripts.
4. **As any player**, I **cannot** create events on campaigns I don’t host or steward (enforced server-side).

## Acceptance criteria

- [x] `createEventCampaign` and `createEventArtifact` (or wrappers) **enforce authorization** consistent with invite rules for the target instance/campaign.
- [x] New artifacts **show up** in `listEventArtifactsForInstance` for the active instance (campaign `instanceId` and/or artifact `instanceId` set correctly).
- [x] **Player-facing UI** on `/event` (or linked modal) allows authorized users to submit create flows; **unauthorized** users do not see primary CTAs or receive clear errors.
- [ ] **Optional:** bundled create (main + N children) is **atomic** or documents failure behavior.
- [x] **Seeds/runbooks** updated to reference the same actions or documented parity checklist.
- [x] `npm run build` and `npm run check` pass.

## Schema (v1)

**No migration required** unless we add optional fields later; reuse `EventCampaign`, `EventArtifact`, `EventCampaign.hostActorIds`, `instanceId` on campaign and artifact.

## API / server actions (v1)

| Action | Purpose |
|--------|---------|
| `assertCanCreateEventForInstance(playerId, instanceId)` | Shared guard for UI + mutations |
| Hardened `createEventCampaign` | Optional `instanceId`; verify steward/host rules |
| Hardened `createEventArtifact` | Verify host/steward; set `instanceId` from campaign when campaign scoped |
| `createMainEventWithPreprodArtifacts` (optional) | Transaction: main + children |

## Non-goals (v1)

- Recurring RRULE authoring UI
- Public event discovery / SEO
- Replacing Partiful or external ticketing
- Full production workflow (Kotter automation) beyond creating rows

## References

- [`src/actions/event-campaign-engine.ts`](../../../src/actions/event-campaign-engine.ts) — current `createEvent*` (auth gaps)
- [`src/actions/campaign-invitation.ts`](../../../src/actions/campaign-invitation.ts) — `canInviteToEventArtifact`, `listEventArtifactsForInstance`
- [`src/app/event/page.tsx`](../../../src/app/event/page.tsx) — consumer UI

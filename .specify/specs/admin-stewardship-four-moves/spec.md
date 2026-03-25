# Spec: Admin stewardship — four moves + campaign/event governance

## Purpose

Restructure **admin** so it is **legible, task-oriented, and aligned with player grammar** (Wake up · Clean up · Grow up · Show up), instead of a flat grid of features where **chat and dev scripts feel more reliable than the UI**. Reduce **entropy** for the primary operator and **future admins** by making **tools, routes, and outcomes** obvious, and by moving **routine campaign/event operations** from developer-only paths into **in-app stewardship** with clear permission boundaries.

**Depends on:** [player-event-creation](../player-event-creation/spec.md), [event-campaign-engine](../event-campaign-engine/spec.md); permissions in [`src/actions/campaign-invitation.ts`](../../../src/actions/campaign-invitation.ts); admin entry [`src/app/admin/page.tsx`](../../../src/app/admin/page.tsx).

---

## Problem statement

- **IA drift:** Admin has accumulated many routes (`/admin/*`) without a **stable mental model**; effects on the **live world** (instances, campaigns, events, `/event`) are not always visible from the place you edit.
- **Ops vs dev:** Day-to-day **campaign and event** changes should not require **repo access** or **ad-hoc scripts** when the data model already supports them.
- **Onboarding:** New admins are dropped into **surface area without narrative**—hard to learn safely.

---

## Six Game Master analysis (design constraints)

### Shaman (meaning / feedback)

Admin actions should **confirm what changed in-world** (which instance, which event, which page to refresh)—not silent saves. Emotional load: operators should trust that **the game world updated**, reducing reliance on chat to “verify reality.”

### Regent (governance)

- **Event stewardship:** Who may **edit** an event must be explicit: **campaign hosts** and/or **instance stewards**, with **admin** able to **reassign ownership / hosts** during a **transitional** period; long-term, **deep admin meddling in player-owned productions** should narrow for **privacy** and **player agency**.
- **Auditability:** Sensitive actions (reassign host, change instance linkage) should be **attributable** (who acted) where the schema allows.

### Challenger (adversarial)

- **IDOR / wrong tenant:** Editing `EventArtifact` or `EventCampaign` must **scope to instance/campaign**; admins are powerful but should not **accidentally** mutate another residency’s rows.
- **God-mode creep:** “Admin can do anything” should be **named operations**, not silent bypass of all checks.

### Architect (structure)

- **Four moves as IA spine:** Top-level admin navigation (or dashboard zones) map to **Wake / Clean / Grow / Show** so **player and admin vocabulary align** (exact labels TBD in implementation—may be “Learn / Repair / Develop / Ship” or direct move names).
- **Task → route → outcome:** Each recurring job links to **one primary route** and **documentation**.

### Diplomat (language / onboarding)

- **Runbooks and UI copy** use the **same terms** as `/event`, `EventCampaign`, `Instance`—no duplicate jargon (“production” vs “campaign” vs “residency”) without a glossary entry.
- **Progressive disclosure:** “Common tasks” before “full catalog.”

### Sage (integration)

- **Six faces × tasks:** Maintain a **matrix** (in spec kit or `docs/`) mapping **admin jobs** to **Game Master faces** so design, implementation, and onboarding stay **one system**.
- **Dev boundary:** **New affordances** (schema, novel flows) stay in **dev/spec**; **operational** edits use **in-app tools** once shipped.

---

## Domain: “Ownership” (v1 definition)

Clarify and document in implementation:

| Concept | Schema / behavior (current or target) |
|---------|--------------------------------------|
| **Event creator** | `EventArtifact.createdByActorId` |
| **Campaign hosts** | `EventCampaign.hostActorIds` (JSON array of player ids) |
| **“Event owner” (product language)** | v1: treat **editable-by** as **hosts + stewards**; **admin** may **edit host list** and metadata; **creator** remains audit trail unless we add a dedicated `ownerId` later |

**Acceptance:** Spec and UI **name one policy**; migrations only if product requires a distinct `eventOwnerId` beyond hosts/creator.

---

## User stories

1. **As an admin**, I open **Admin** and see **four move-aligned zones** (or equivalent wayfinding) so I know **where to go** for common jobs.
2. **As a campaign host or steward**, I **edit an existing event’s** title, description, schedule, capacity, and visibility from **inside the app** (player or admin path) without raw SQL.
3. **As an admin**, I can **reassign who is listed as host / owner** for a campaign or event (within defined rules) for **handoff**; this is **temporary breadth** until players fully self-serve.
4. **As a new admin**, I can follow a **short runbook** that lists **tasks**, **routes**, and **which Game Master face** they align with—without reading the whole repo.
5. **As a developer**, I reserve **scripts and chat** for **new** capabilities—not for changing a night’s time that already lives in `EventArtifact`.

## Acceptance criteria (phased)

### Phase A — IA + wayfinding

- [x] Admin **home** documents the **four moves** mapping (even if some sections are stubs).
- [x] **Campaign / event** stewardship has a **primary entry** from admin (link to instance/campaign/event tools—not buried only in `/event`).
- [x] **Six-face × task** appendix exists (table in spec or linked doc).

### Phase B — Edit event in-app

- [x] Authorized users can **update** `EventArtifact` fields needed for ops (schedule + **Details** on `/event` for title/description/visibility/status).
- [x] **Permission model** matches policy: owners/hosts/stewards; **admin override** documented and enforced in server actions.
- [x] **`revalidatePath`** (or equivalent) so **`/event`** reflects changes.

### Phase C — Reassign ownership / hosts

- [x] **Admin-only** (or steward) action to update **`EventCampaign.hostActorIds`** (and/or related fields) with **validation** and **confirmation** copy about responsibility.
- [x] **Non-goals** for v1: arbitrary impersonation, reading private player content beyond campaign scope.

### Cross-cutting

- [x] `npm run build` and `npm run check` pass after each merged phase.

## Non-goals (initial)

- Rewriting **every** admin sub-app in one release.
- Full **RBAC product** beyond campaign/event stewardship (iterate).
- Replacing **all** developer seeds—**parity** where it hurts operators first.

## References

- [`src/app/admin/page.tsx`](../../../src/app/admin/page.tsx) — current Control Center
- [`src/app/event/page.tsx`](../../../src/app/event/page.tsx) — campaign event surface
- [`src/actions/event-campaign-engine.ts`](../../../src/actions/event-campaign-engine.ts) — artifacts/campaigns
- [`docs/runbooks/PLAYER_EVENT_CREATION.md`](../../../docs/runbooks/PLAYER_EVENT_CREATION.md) — player create path

# Spec: Event invite BAR — party invitation + Partiful + event-scoped initiation Twine

## Purpose

Define the **product and technical contract** for using a **public `event_invite` BAR** as the **primary shareable invitation** to a real-world **party / residency event**, with:

1. **RSVP on Partiful** — canonical logistics (headcount, address gate, comms) via an **explicit outbound URL** stored on the BAR (or paired config).
2. **Enter the app — initiation Twine** — **onboarding for the sub-campaign that is the event itself**, implemented as a **dedicated published `Adventure` per event** (not only the generic top-level Bruised Banana initiation).

This spec **extends** the JSON CYOA doorway in [EVENT_INVITE_BAR_CYOA_MVP.md](../campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md): the short JSON story remains the **emotional doorway**; **Twine initiation** is the **deeper onboarding** keyed by **event slug**.

**Related:** [party-mini-game-event-layer/spec.md](../party-mini-game-event-layer/spec.md) (invite bingo layer), [campaign-subcampaigns/spec.md](../campaign-subcampaigns/spec.md) (colon `ref` — allyship domains; **event slugs are separate** from allyship subcampaign keys).

---

## User stories

1. **As a host**, I can share **one BAR URL** that reads as “the invitation” and offers **RSVP (Partiful)** plus **play the initiation** for **this specific night / event**.
2. **As a guest**, I can open that link **without logging in**, read the short orientation (JSON CYOA), then choose **RSVP on Partiful** or **continue into initiation Twine** for **this event’s** onboarding.
3. **As a campaign steward**, I can publish **one Twine `Adventure` per event** (e.g. Apr 4 dance vs Apr 5 game) and have **stable, explicit event slugs in the URL** for sharing and support.
4. **As the product**, we preserve **Partiful as system of record for RSVP** while the **BAR** owns **narrative framing** and **engine onboarding** scoped to the event.

---

## Requirements

### URL — explicit event slugs (canonical)

- **Initiation** for an event MUST be reachable at a URL that includes an **`eventSlug`** segment that is **human-readable and stable** (kebab-case).
- **Recommended canonical pattern (path-based):**

  `/campaign/event/[eventSlug]/initiation`

  Optional query: `segment=player|sponsor` (default `player`), `shareToken=…` when needed — aligned with existing initiation patterns.

- **Examples (Bruised Banana residency):**
  - `apr-4-dance` — April 4 public dance
  - `apr-5-game` — April 5 collaborators / donors (“The Game”)

- **Alternatives considered:** `?ref=bruised-banana&event=apr-4-dance` on `/campaign/initiation` — valid for smaller route changes; **path-based preferred** for clarity in marketing and logs.

### Adventures — one Twine per event

- Each event onboarding MUST map to **exactly one published `Adventure`** (status `ACTIVE`) for the **player** path at minimum.
- **Adventure slug convention (normative):**

  `{campaignRef}-event-{eventSlug}-initiation-{segment}`

  Example: `bruised-banana-event-apr-4-dance-initiation-player`

- **Sponsor** (or other segments): same pattern with `segment` suffix as today (`player` | `sponsor`).

### BAR — invitation surface

- **`type: event_invite`**, **`visibility: public`**, **`campaignRef`** set (e.g. `bruised-banana`).
- **Configuration (conceptual — implementation may use JSON on `CustomBar`, story envelope, or small migration):**
  - `partifulUrl` — required for the **RSVP on Partiful** primary action (HTTPS).
  - `eventSlug` — must match the initiation route and Adventure slug segment (e.g. `apr-4-dance`).
- **UI:** The public invite surface MUST expose **two primary actions** (in addition to optional JSON CYOA choices):
  - **RSVP on Partiful** → `partifulUrl` (open in new tab).
  - **Begin initiation** → `/campaign/event/{eventSlug}/initiation` (same tab or in-app navigation).

### JSON CYOA (doorway)

- The existing **short JSON story** (`storyContent`, `EventInviteStory`) MAY remain the **first screen**; ending CTAs SHOULD align with the two-button model (Partiful + initiation) once implemented.

### JSON CYOA — authoring & guest navigation (policy)

- **Who may edit** (when story editing is in-product): **campaign owners** for the BAR’s `campaignRef` **and** **admin** only — not arbitrary logged-in players.
- **Guest navigation:** readers SHOULD be able to **go back** and pick another branch on **non-confirmation** passages (history stack or equivalent).
- **Confirmation passages:** steps that **commit** the guest to an outcome (e.g. **RSVP / Partiful**, **Begin initiation**, or other explicit “you chose this” surfaces) MUST **not** offer **Back** into the prior branch — treat them as a **hard stop** for backward navigation (browser back may still exist; product UI does not re-open the fork).
- **Versioning** of published invite stories is **out of scope** for the first ship; see backlog **EIPV** for a future spec (snapshots / history) if needed.

### Non-goals (v1 of this spec)

- Partiful API sync or webhook.
- Replacing Partiful RSVP with in-app-only RSVP.
- Using **allyship** `ref` colon subdomains (`bruised-banana:GATHERING_RESOURCES`) as **event identity** — events use **`eventSlug`**, not allyship keys, unless explicitly bridged in a later spec.

---

## Acceptance criteria

- [ ] Two distinct **event slugs** (e.g. `apr-4-dance`, `apr-5-game`) resolve to **two distinct** initiation routes and **two published** Adventures per segment.
- [ ] A public **event_invite** BAR can be configured with **partifulUrl** + **eventSlug** and presents **RSVP** + **initiation** without requiring login for the doorway.
- [ ] URLs are **copy-paste stable** and documented for operators (see `docs/events/`).

---

## References

- Implementation appendix: [EVENT_INVITE_BAR_CYOA_MVP.md](../campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md)
- Current initiation entry: [`src/app/campaign/initiation/page.tsx`](../../../src/app/campaign/initiation/page.tsx) (today: single `bruised-banana-initiation-{segment}` slug — this spec generalizes per **event**).
- Host playbook: [`docs/events/HOST_EVENT_INVITE_BAR.md`](../../../docs/events/HOST_EVENT_INVITE_BAR.md)
- **T7 verification gate:** [`docs/events/EIP_T7_VERIFICATION.md`](../../../docs/events/EIP_T7_VERIFICATION.md) — `npm run verify:event-invite-seed` after seed; incognito QA checklist.

# Host playbook — event_invite BAR + Partiful

Use this when you want **RSVP on Partiful** and a **short in-app doorway** (JSON CYOA) that orients guests and points them at the **campaign**, **hub**, **invite mini-game** anchor, and **sign-in**.

**Next evolution (spec):** **BAR-first invitation** with **RSVP (Partiful)** + **event-scoped initiation Twine** — explicit **`eventSlug`** in the URL and **one Twine Adventure per event**. See [.specify/specs/event-invite-party-initiation/spec.md](../../.specify/specs/event-invite-party-initiation/spec.md).

## 1. What you get

- A **`CustomBar`** with `type: event_invite`, `visibility: public`, `campaignRef` (e.g. `bruised-banana`), and `storyContent` = validated [`EventInviteStory`](../../src/lib/event-invite-story/schema.ts) JSON.
- Public URL: **`/invite/event/<barId>`** — no account required ([`src/app/invite/event/[barId]/page.tsx`](../../src/app/invite/event/[barId]/page.tsx)).

## 2. Authoring the story

- Passages: markdown `text`, `choices` → `next`, or final `ending` with role + description.
- Optional root **`endingCtas`**: array of `{ href, label, className }` — if omitted, defaults from [`default-cta.ts`](../../src/lib/event-invite-story/default-cta.ts) apply.
- Helper: **`eventInviteStandardCtasWithMiniGame('/event#...')`** adds the **Invite friends (mini-game)** button between campaign and hub.

## 3. Seeding / ops

1. Choose an **immutable** `id` (changing it breaks shared links).
2. Run the seed script or `upsert` via admin tooling.
3. Paste **`https://<host>/invite/event/<id>`** into Partiful — see [PARTIFUL_ENGINE_LINKS.md](./PARTIFUL_ENGINE_LINKS.md).

## 4. Spec references

- [EVENT_INVITE_BAR_CYOA_MVP.md](../../.specify/specs/campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md)
- [party-mini-game-event-layer/spec.md](../../.specify/specs/party-mini-game-event-layer/spec.md) — interactive grid later; anchors on `/event` work today.

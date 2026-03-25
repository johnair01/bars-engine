# Plan: Event invite BAR — party + Partiful + event-scoped initiation

Implement per [spec.md](./spec.md). Depends on existing `event_invite` BAR + [`EventInviteStoryReader`](../../../src/components/event-invite/EventInviteStoryReader.tsx).

## Phase 1 — Routing + Adventure resolution

- Add **`/campaign/event/[eventSlug]/initiation`** (or agreed equivalent) that:
  - Validates `eventSlug` against an allowlist or resolves via DB/config map.
  - Loads `Adventure` where `slug === {campaignRef}-event-{eventSlug}-initiation-{segment}` (default `campaignRef` from instance or query).
  - Reuses **`CampaignReader`** / initiation shell patterns from [`initiation/page.tsx`](../../../src/app/campaign/initiation/page.tsx).
- Keep **`/campaign/initiation`** behavior for **legacy** top-level BB initiation until deprecated in tasks.

## Phase 2 — BAR configuration

- Persist **`partifulUrl`** and **`eventSlug`** for each event-invite BAR (JSON field on `CustomBar`, or `storyContent` envelope — choose one; document in tasks).
- Update **seed** scripts for Apr 4 / Apr 5 BARs to include config + align **button copy** in JSON ending CTAs or a small header component.

## Phase 3 — Public invite UI

- **`/invite/event/[barId]`**: render **prominent** Partiful + Initiation buttons (above or beside CYOA) when config present.
- Ensure **mobile-first** tap targets ([`UI_COVENANT.md`](../../../UI_COVENANT.md)).

## Phase 4 — Content + publish

- Author/publish Twine compilations → **`Adventure`** rows for each `bruised-banana-event-{slug}-initiation-player` (and sponsor if needed).
- Verify unauthenticated doorway still works; initiation may require sign-in only where existing campaign rules require it (document behavior).

## Verification

- `npm run build` / `npm run check`.
- Manual: incognito BAR → Partiful opens → initiation loads correct Adventure for slug.

## Files (likely)

| Area | Files |
|------|--------|
| Route | `src/app/campaign/event/[eventSlug]/initiation/page.tsx` (new) |
| BAR config | `prisma` or JSON on `CustomBar` — see tasks |
| Invite UI | `src/app/invite/event/[barId]/page.tsx`, possibly `EventInviteStoryReader` |
| Seed | `scripts/seed-bruised-banana-event-invite-bar.ts` |
| Docs | `docs/events/HOST_EVENT_INVITE_BAR.md`, `PARTIFUL_ENGINE_LINKS.md` |

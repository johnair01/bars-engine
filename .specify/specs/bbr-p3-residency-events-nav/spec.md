# BBR P3 — Residency events surface + Show Up navigation

## Purpose

Close [BACKLOG.md](../../backlog/BACKLOG.md) **BBR P3**: surface **events** on the **Bruised Banana** residency campaign (`campaignRef: bruised-banana`) and tighten **Show Up** paths from **NOW → campaign → `/event`**.

## Requirements

1. **Campaign hub** (`/campaign/hub?ref=bruised-banana`): visible **residency nights** callout with deep links to `/event#apr-4` and `/event#apr-5` (and full `/event`).
2. **Campaign modal** (NOW → Campaign): when the active campaign is BB, show quick links to Apr 4 / Apr 5 anchors alongside the existing Event Page CTA.
3. **Orientation compass**: when the suggested move is **Show Up** and the player’s residency context is BB, offer a secondary **Residency events** link to `/event`.
4. **Top nav** (optional clarity): authenticated players get an **Events** link to `/event` so the path is not only through Campaign modal / hub.

## Non-goals

- NEV bingo modals (separate spec).
- House instance UI (bruised-banana-house Phase 2+).

## Acceptance

- [x] Hub shows events callout for `ref=bruised-banana` only.
- [x] Incognito not required; logged-in QA: NOW → Events nav → `/event`; compass Show Up + BB shows collective link.

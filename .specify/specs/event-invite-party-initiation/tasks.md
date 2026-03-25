# Tasks: Event invite BAR — party + Partiful + event-scoped initiation

- [x] **T1** Document Adventure slug convention and `eventSlug` allowlist (e.g. `apr-4-dance`, `apr-5-game`) in spec § Requirements; add operator one-pager in `docs/events/`.
- [x] **T2** Implement **`/campaign/event/[eventSlug]/initiation`** resolving to `Adventure` slug `bruised-banana-event-{eventSlug}-initiation-{segment}` (default segment `player`).
- [x] **T3** Add **BAR-level config** for `partifulUrl` + `eventSlug` (Prisma fields on `CustomBar`).
- [x] **T4** Update **`/invite/event/[barId]`** to show **RSVP on Partiful** + **Begin initiation** as primary actions when config is present.
- [x] **T5** Publish **two Adventures** (Apr 4 / Apr 5 player path minimum) with matching slugs; wire seed or admin instructions.
- [x] **T6** Update **seed** `scripts/seed-bruised-banana-event-invite-bar.ts` with Partiful placeholders + `eventSlug` per BAR.
- [ ] **T7** `npm run check` + manual incognito QA (BAR → Partiful + initiation). *(Check passes; run `npm run seed:event-invite-bar` against DB, then QA.)*

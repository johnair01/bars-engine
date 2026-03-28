# Tasks — Player downtime tracks

- [ ] **T1** Add `src/lib/downtime-tracks/catalog.ts` with default seven tracks + stable ids; unit test count.
- [ ] **T2** Implement `escalation.ts` + tests (multi-track cost matches spec intent).
- [ ] **T3** Implement `outcomes.ts` (bands + copy) — no random unless specified later.
- [ ] **T4** Prisma: add `PlayerDowntimeCycle` (or agreed storage) + `npx prisma migrate dev --name player_downtime_cycles` + commit SQL.
- [ ] **T5** `getDowntimeBoard` + `submitDowntimeCycle` server actions with auth.
- [ ] **T6** Minimal **DowntimeBoard** UI + link from Hand or campaign (specify route in PR).
- [ ] **T7** Verification quest `cert-player-downtime-tracks-v1` + seed note.
- [ ] **T8** `npm run check`; document instance flag for BAR emit (if implemented).

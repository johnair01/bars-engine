# Tasks: Player signal garden & library charge metabolism

## Phase 0 — Spike & contracts

- [ ] **PSG-0.1** Compare persistence options (`PlayerSignal` table vs `signal_draft` BAR); document choice in `spec.md` **Design Decisions**.
- [ ] **PSG-0.2** Document charge-capture **daily limit** interaction + recommended policy for organizers.
- [ ] **PSG-0.3** List integration points: NEV compost, Hand, `/capture`, Library, LCG — add to `plan.md` if gaps found.
- [ ] **PSG-0.4** Freeze **API Contracts** in `spec.md` (replace sketch with real types).

## Phase 1 — Signal inbox + promote

- [ ] **PSG-1.1** If schema: `npx prisma migrate dev --name player_signal_garden_v0` + commit `prisma/migrations/` + `npm run db:record-schema-hash` (human verifies SQL).
- [ ] **PSG-1.2** Implement `createPlayerSignal` / list / promote server actions with ownership checks.
- [ ] **PSG-1.3** Ship minimal **Garden** UI (list + promote + weed/snooze).
- [ ] **PSG-1.4** `npm run check` + `npm run build`.

## Phase 2 — Spaced cadence

- [ ] **PSG-2.1** Implement `nextReviewAt` updates on user actions (deterministic rules).
- [ ] **PSG-2.2** UX copy: compost / 321 links; optional dashboard card (defer if not trivial).

## Phase 3 — Library praxis + librarian signal

- [ ] **PSG-3.1** Short quest template from library excerpt or thread slice.
- [ ] **PSG-3.2** Persist charge overlay / lineage fields on completion.
- [ ] **PSG-3.3** Vibeulon or attunement hook per product decision.
- [ ] **PSG-3.4** Librarian aggregate read API + minimal admin table.

## Phase 4 — Verification quest

- [ ] **PSG-4.1** Author + seed `cert-player-signal-garden-v1` (Twine + system BAR).
- [ ] **PSG-4.2** Document `npm run` seed command in `plan.md` / cert quest index.

---

_Check off tasks as completed; Phase 1+ may proceed only after **PSG-0.4** if team wants strict API-first gate._

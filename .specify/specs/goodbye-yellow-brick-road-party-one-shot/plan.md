# Plan: Goodbye Yellow Brick Road — Oracle party one-shot

Implement per [spec.md](./spec.md). The implementation strategy is **surgical extension of Valkyrie Party**, not parallel architecture.

## Implementation order

1. **Fork party config + theme** — establish a new party slug/route/config, preserve Oracle art/UI, apply emerald/gold/cream/plum palette.
2. **Party interpretation data** — add generated Goodbye + Spicy readings with structured achievements/affordances.
3. **Game event primitive** — add one append-only `PartyGameEvent` model/action layer.
4. **Personal hand projection** — derive 3-card hand and no-repeat cycle from party events + existing Oracle/discovery data.
5. **Play/Discard/Complete actions** — emit events and replenish hand.
6. **Shared board projection** — featured GM card, Active plays, Completed plays.
7. **GM wall-clock schedule** — 12 deterministic unlock slots from 8:00–11:40 PM PDT with simple host feature/early-unlock override.
8. **Midnight Spicy gate** — browse always; random Spicy play/draw legal at 12:00 AM PDT Aug 16.
9. **Achievement resolution** — award structured party-scoped achievement on `I did this`.
10. **Hard BAR adapter** — reuse existing BAR path if guest-compatible; otherwise record `bar_capture_pending` without blocking play.
11. **Live-edit refresh** — preserve dynamic Oracle override editing and add lightweight active-party refetch if needed.
12. **Mobile verification + deploy** — synthetic player flows, host override, midnight/time boundary, live edit, failure fallback.

---

## Reuse map

| Existing Valkyrie surface | Reuse strategy |
|---|---|
| `src/lib/valkyrie-party/service.ts` | Fork/generalize minimally; preserve guest join, deck assembly, discovery, admin patterns |
| `src/components/valkyrie-party/PartyApp.tsx` | Preserve card rendering/layout and interaction conventions; add lens, hand, board, and party state around it |
| `public/oracle/deck.json` | Canonical base card identity/art/suit/rank/title source |
| `PartyExperience` | New party instance metadata/schedule/theme |
| `PartyParticipant` + guest `Player` | Reuse unchanged |
| `PartyOracleDiscovery` | Continue as exposure/history; do not make it sole current-hand state |
| `PartyOracleCardOverride` | Keep as live Game Master patch layer |
| `PartyQuestCompletion` concepts | Reference for self-attested completion UX, but do not force card plays into quest semantics |
| existing admin token / host checks | Reuse unchanged/minimally parameterized |
| existing BAR actions | Adapter target only; no new BAR subsystem |

---

## New persistence

### `PartyGameEvent`

Prefer one additive Prisma model, roughly:

```prisma
model PartyGameEvent {
  id          String   @id @default(cuid())
  partyId     String
  playerId    String?
  type        String
  cardId      String?
  payloadJson Json     @default("{}")
  createdAt   DateTime @default(now())

  party       PartyExperience @relation(fields: [partyId], references: [id], onDelete: Cascade)
  player      Player?         @relation(fields: [playerId], references: [id], onDelete: SetNull)

  @@index([partyId, createdAt])
  @@index([partyId, playerId, createdAt])
  @@index([partyId, type, createdAt])
}
```

Exact relation field names must match current Prisma conventions. Do not add more tables unless implementation proves projection from events is insufficient.

---

## Hand projection algorithm

For a player + party:

1. Load base Oracle card IDs.
2. Load that player's relevant `PartyGameEvent`s ordered chronologically.
3. Determine current cycle number from explicit reset/cycle event or by counting resolved unique card IDs.
4. Determine base cards resolved in current cycle (`card_played` or `card_discarded`; initial hand cards remain unresolved until one of those events).
5. Determine cards currently in hand from latest `card_drawn` minus subsequent `card_played`/`card_discarded` for that draw/card.
6. If hand has fewer than 3 cards after 8:00 PM, draw uniformly/randomly from cards not in hand and not resolved in the current cycle.
7. When the full corpus is exhausted, reset/increment cycle and allow base IDs again.

Implementation may simplify by stamping `cycle` on event payloads so projection does not need inference.

### Atomicity

Play/Discard + replacement draw should be performed in a transaction where practical so rapid taps do not produce oversized hands or duplicate draws.

Server must reject duplicate resolution of the same active hand card/event.

---

## Party reading config

Suggested location:

```text
src/lib/goodbye-party/data/interpretations.json
```

or a closely matching party-specific folder following Valkyrie conventions.

Also include:

- party metadata/config;
- 12 GM slot definitions containing time + base Oracle card ID + featured reading metadata;
- palette/theme tokens if current Valkyrie config supports them.

Do not store generated party content inside canonical `public/oracle/deck.json`.

---

## Reading merge strategy

Build resulting card as:

```text
canonical Oracle
+ party interpretation JSON
+ existing dynamic DB override
```

The runtime card shape should expose the two lenses and structured achievement data while preserving existing fields consumed by current card UI.

If broad changes to Valkyrie's card type would create high blast radius, add party-specific fields alongside existing `prompts.easy|medium|hard` rather than migrating old callers.

---

## Game Board projection

Build board response from `PartyGameEvent` rather than persisting a mutable board document.

Minimum projection:

```ts
type PartyBoard = {
  featuredGmCard: ...
  unlockedGmCards: ...
  activePlays: ...
  completedPlays: ...
}
```

For each `card_played`, consider it Active until a matching `card_completed` references its play-event ID.

Multiple players may have independent plays of the same base card.

---

## GM schedule implementation

Use `America/Los_Angeles` semantics and absolute event date.

Normal unlocked slot count can be derived from server/client time relative to:

```text
2026-08-15T20:00:00-07:00
```

At 20-minute intervals through 23:40.

Do not use cron/background jobs.

Persist only exceptional host moves, such as:

- `gm_card_featured`
- early `gm_card_unlocked`

Nothing ever re-locks.

---

## Midnight gate

The threshold is:

```text
2026-08-16T00:00:00-07:00
```

Rules:

- pre-midnight: Spicy reading visible/browsable/editable;
- pre-midnight: random Spicy play/draw affordance disabled;
- at/after midnight: enable random Spicy play/draw;
- existing hand remains the same 3 base cards; no second hand is created.

Avoid client-only trust for the gate; server actions should enforce it too.

---

## Achievement implementation

Achievement data is content/config, not a new achievement database hierarchy.

On `card_completed`:

1. read selected lens/depth interpretation;
2. validate achievement family enum;
3. emit `achievement_unlocked` event with a snapshot of the configured achievement;
4. show achievement to player with its affordance.

Historical achievement may remain in the record; UI should communicate that the active affordance is party-scoped.

---

## Hard BAR adapter

Recon task during implementation:

1. Inspect `src/actions/bars.ts` and/or `src/actions/capture-bar.ts` for auth assumptions.
2. Attempt to create a BAR for a Valkyrie-style `party_guest` Player through the smallest existing path.
3. If clean, call existing creation path and stamp provenance.
4. If auth/ownership coupling requires meaningful new architecture, stop integration work and emit `bar_capture_pending` instead.

**Stop condition:** BAR integration gets no more than a thin adapter. It is not allowed to expand scope.

---

## Live editing

Existing `PartyOracleCardOverride` DB rows are merged into `buildPartyDeck()`.

Implementation should verify the exact admin mutation route/component and how `PartyApp` refreshes its payload.

If no active refetch exists, add a simple 15–30 second refetch/poll while the party route is active, plus immediate refetch after local meaningful mutations when convenient.

Do not add websocket infrastructure.

---

## UI plan

Preserve Valkyrie layout/card components where possible.

New/changed visible surfaces:

- party palette/theme;
- lens selector: `Goodbye` / `Spicy`;
- depth selector remains E/M/H;
- `My Hand` with 3 cards after 8 PM;
- `Play` / `Discard` controls;
- shared Board with featured GM card + Active + Completed;
- `I did this` completion action;
- earned achievement/affordance display;
- pre-midnight Spicy draw lock copy;
- minimal host controls.

Hide/defer player-authored card controls for this one-shot even if underlying Valkyrie route supports them.

---

## Verification matrix

### Pre-party

- Browse every base Oracle card without changing hand/discovery cycle state used for draws.
- Goodbye + Spicy readings render for each card/depth.
- No hand appears before 8 PM.
- Admin can edit a reading and see the update after refetch.

### 8 PM start

- New guest joins without full signup.
- Exactly 3 hand cards appear.
- No duplicates in hand.

### Hand loop

- Discard one → replacement → still 3.
- Play one → board Active → replacement → still 3.
- Rapid double tap does not produce duplicate/extra resolution.
- Seen/resolved card does not reappear during same cycle.

### Board + achievement

- Two players can play same base card independently.
- `I did this` changes only that play to Completed.
- configured achievement is emitted/shown once for the completion.
- active card can remain unfinished forever without blocking hand/play.

### GM schedule

- Simulate timestamps at 19:59, 20:00, 20:19, 20:20, 23:40.
- Host can feature an unlocked card.
- Host early unlock persists across refresh.

### Midnight

- 23:59: Spicy browse yes, random Spicy play/draw no.
- 00:00: random Spicy play/draw yes.
- existing hand does not reset.

### BAR

- Hard completion succeeds even if BAR creation fails.
- successful BAR contains party/card/lens/depth/play-event provenance.
- fallback event captures pending payload.

### Mobile

- common iPhone viewport has no horizontal scroll;
- hand and featured GM card are usable one-handed;
- board does not dominate the real-world party.

### Repository checks

Run project-standard checks (`npm run check` and/or current equivalent) plus targeted tests added for event projection/time gates.

---

## Stop conditions / anti-scope rules

During implementation, do not generalize merely because the party feature *could* become reusable.

Stop and choose the simpler path if work starts requiring:

- generic plugin/event framework;
- generalized achievement engine;
- realtime infrastructure;
- full BAR auth refactor;
- new player progression system;
- new Oracle renderer;
- player card authoring redesign;
- generalized scheduling service.

Tomorrow's live one-shot is the validation event. Generalize only after actual play proves the mechanic deserves it.

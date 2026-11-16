# Tasks: BAR intake record and polarity decks

Each phase is one pull request, checked with `scripts/local/check.sh --build`, labeled `ship-next`.

## Phase 1: Schema and writer (no gate)

- [ ] Add `intakeRecord Json?` to `CustomBar` and `POLARITY` to `DeckType`; one migration (`npx prisma migrate dev
      --name bar_intake_record_polarity_deck`), then `npm run db:record-schema-hash` and `npm run db:generate`
- [ ] `src/lib/intake/record.ts`: the `IntakeRecord` type of FR-002, doors chat, board, garden, map, floor; states
      confirmed, draft, open, composted; `carriedTo`
- [ ] `src/lib/intake/write.ts`: `writeIntakeToBar` (FR-003), with tests: stamps door and time, appends items, refuses a
      rewrite of verbatim words, refuses a garden patch outside FR-012
- [ ] A test that fails when any other file writes `intakeRecord`

## Phase 2: Merged pair table (no gate)

- [ ] `src/lib/polarity/pair-table.ts` keyed by trigram (FR-005), Challenger row filled (FR-006), Thunder and Water
      holders as placeholders, Fire keeps both pairs
- [ ] Derive or check `two-move.js` `PAIRS` and `TRIGRAM_RELATIONAL_PAIR2` against it; `two-move.test.ts` stays green

## Phase 3: Dealer (gate: bar-decks-pole-1)

- [ ] `src/lib/polarity/deal.ts`: `dealPolarityCard` and `poleFor` (FR-008), the ruled pole rule only
- [ ] `deal.test.ts`: the fixed-seed cases and the 4,096-case enumeration of FR-009

## Phase 4: Challenger deck and hand (gate: bar-decks-shielding-look-1 for the look)

- [ ] Seed the Challenger's polarity deck: 32 cards, 4 Shielding live, 28 sealed; Grow Up cards marked `(book to name)`
- [ ] Sealed-card hand state with the redirect line (FR-010); a test for one Sparring cast and one line 6 recast
- [ ] Keep path: the player's capture becomes a BAR through the writer, and a kept BAR moves the needle (FR-011)
- [ ] Pictures with `scripts/local/dev.sh shot`, carried into a look row (no PR link on the row)

## Phase 5: Doors (gate: bar-decks-garden-1 for playtester permissions beyond the floor)

- [ ] Board door by card-turn (FR-013)
- [ ] Garden view reading `intakeRecord` (FR-012)
- [ ] MCP chat tool calling the writer (FR-014)

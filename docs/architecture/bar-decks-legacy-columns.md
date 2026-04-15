# Legacy `bar_decks` columns removed

**Context:** Older databases sometimes had extra columns on `bar_decks` (`deckType`, `libraryId`) that were **never read** by the shipped app. BAR System v1 uses only `instanceId` + cards — see [bar-system-v1.md](bar-system-v1.md).

**What we did:** Those columns are dropped idempotently when you run `npm run db:repair` / `npm run db:sync` (see `dropLegacyBarDeckColumns` in `scripts/db-repair-drift.ts`).

**If something looks wrong later:** The daily hand (`/hand/deck`) and deck APIs only depend on `BarDeck.instanceId` and `BarDeckCard` rows. If a player hits an error after a DB sync, check that their campaign `Instance` still has a deck with 52 cards (`scripts/seed-bar-deck.ts`). Missing data in removed columns would not have been used by the client anyway.

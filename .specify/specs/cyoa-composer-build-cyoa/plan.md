# Plan: Composer CYOA → CyoaBuild

## Decisions needed

1. **Storage** — Instance JSON vs player-scoped JSON vs new table (see spec §3).
2. **Surface** — New Twine slug vs dedicated `/campaign/composer` route vs modal on hub.
3. **Resume** — After check-in redirect, resume composer at **same** partial state (session id vs server-stored partial build).

## Phases

1. **Persist CyoaBuild** — minimal API + store; no UI.
2. **Composer graph** — branches → partial merge → terminal validate + save.
3. **Hub/spoke read path** — GSCP / spoke loads build if exists.
4. **Polish** — copy, Sifu labels, Diplomat weave strings.

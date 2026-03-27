# Playtest: vault gate on spoke emit (CHS)

**Intent:** Verify hard vault block + compost path before treating CHS emit flows as production-safe.

## Preconditions

- Local or staging with DB migrated; test player with known vault state.
- Campaign with `portalAdventureId` seeded (`npm run seed:portal-adventure` or equivalent).
- Optional: configure vault at/near cap per [vault-page-experience](../vault-page-experience/spec.md) / `vault-limits`.

## Steps

1. Log in as player A. Fill vault to **at or over** cap for next BAR emission (exact mechanism depends on implemented gate — may require env or seed script).
2. Open `/campaign/hub?ref={campaignRef}` → **Enter** a spoke → reach **emit** node (Wake/Clean/Show).
3. **Expect:** block message and/or **modal compost** CTA (per [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) implementation state — stub may only message).
4. Complete compost (or reduce vault) → retry emit → **Expect:** BAR creates and hub journey state updates if query params present.

## Record

- Date / env / commit
- Pass/fail + screenshot or note

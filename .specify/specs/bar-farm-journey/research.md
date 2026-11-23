# Research: BAR to farm journey

## Verified on 2026-11-17

- Main contains [farm-seed-item](../farm-seed-item/spec.md), a ruled mapping of five moves to farm verbs. Its implementation tasks are still unchecked.
- [#732](https://github.com/johnair01/bars-engine/pull/732) is open. Its description says it adds send-to-farm, `BetweenPrivate` key `seeds`, and the farm Seeds panel; browser and database checks are outstanding.
- [#823](https://github.com/johnair01/bars-engine/pull/823) is open and stacks on #763. Its description says parcels and server-only satchel seeds are implemented and local request checks passed; Board look and hosted/real-phone checks are outstanding.
- [#802](https://github.com/johnair01/bars-engine/pull/802) is open and stacks on #793. Its description explicitly says live farm planting does not send crop data and no BAR/intake act record is written.
- Git tree differences confirm these PRs all change `src/app/api/between/farm/route.ts` and/or `public/between/farm/farm.js`. The integration must reconcile overlapping files, not merely cherry-pick three independent patches.

## Source contract traced from PR heads

GitHub file reads succeeded for the three PR heads after the local blob-filtered checkout could not fetch missing blobs.

| Piece | Current shape | Consequence |
|---|---|---|
| #732 BAR work seed | `BetweenPrivate` key `seeds`, array of `{barId, status, ticketKey, specKey, specUrl, prUrl, ...}`. `sendToFarm` checks ownership, reads the array, writes a new entry, then queues a work ticket. | This is work metadata. It does **not** create a farm parcel. Read/append/write is not yet a proven atomic idempotency boundary under concurrent sends. |
| #823 parcel | `BetweenPrivate` key `farm-world`, `parcels[]` with `captureId`, `label`, and sealed/opened/composted state. Agent `farm_world_change kind:seed` creates it. | A BAR send does not call this writer. The same BAR can acquire more than one parcel unless creation is explicitly deduplicated by source identity. |
| #823 satchel | `BetweenPrivate` key `pouch`, `seeds[]` with `{id: seed-${parcelId}, parcelId, captureId, label, at}`. Taking a parcel moves it here in a transaction. | `captureId` is the possible bridge to `barId`, but neither type requires that meaning for all parcels. |
| #823 plot | `plant-seed` finds satchel seed and calls `F.plant(..., seed.captureId, seed.label, ...)`, then removes it from the satchel in one transaction. | A BAR parcel can preserve `barId` on the plant if its `captureId` is set to that ID. |
| #802 crop | `Crop = { family, form }`; `Plant.crop` is optional. The PR says the live farm page does not send crop data. | The BAR send path has no crop source yet. The integration must not invent a family from BAR work type. |

**First broken seam:** send-to-farm creates work metadata and a ticket, but no sealed parcel. The farm-world parcel path is agent-driven. The smallest bridge is a server-side send transaction that records the BAR work seed and one parcel with `captureId = barId`, using one deduplication rule. It must preserve agent-created parcels that are not BAR sends. This is an implementation hypothesis until the combined branch is run locally.

**Open proof:** No combined local server, browser, or database walkthrough has been run. Source-level concurrency behavior and legacy reconciliation need testing. In particular, the #732 read/append/write and ticket write are not one transaction in the head examined; #823 wraps parcel take and planting in transactions, but a two-tab browser test remains outstanding.

## Decision ledger

| Question | Current position | Authority |
|---|---|---|
| Five-move farm order | Preserve it | `farm-seed-item`, Board `ffm-look-1` |
| One logical seed across panel, parcel, satchel, plot | Integration requirement; data shape pending source trace | This spec |
| Does farm harvest verify a real act? | No | This spec; #802 states act recording absent |
| Compost reversibility, mana watering | Keep current behavior until a concrete Board ruling | Existing farm specs |

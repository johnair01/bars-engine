# Plan: Campaign marketplace slots & wilderness IA

## Implementation order

1. **Phase A — IA & copy** (ship clarity before economics)  
   - Audit `/campaign/hub`, `/campaign/board`, map entry routes for **wild vs market** language (see repo `src/app/campaign/`).  
   - Add **canonical CTA** plumbing: Hand / completion surfaces → link to future marketplace route (may 404 or stub until Phase B).  
   - Document **dual graph** in [`docs/`](../../docs/) or wiki pointer (optional one-pager).

2. **Phase B — Persistence & server actions**  
   - Decide **scope key**: `playerId` + `campaignRef` vs global per player (spec TBD — default **per `campaignRef`** to align with BB).  
   - Schema: new `CampaignMarketplaceSlot` (or extend `GameboardSlot` with `slotKind: 'player_stall' | 'system_deck'`) — **prefer new table** to avoid breaking existing gameboard draws.  
   - Implement `listPlayerCampaignSlots`, `attachArtifactToSlot`, `purchaseAdditionalSlot` per [spec.md](./spec.md).  
   - Wire **player-generated campaign** container: evaluate reuse of `EventCampaign` vs lightweight `PlayerCampaign` model.

3. **Phase C — Marketplace UI + mitigation**  
   - Route: e.g. `/campaign/marketplace?ref=…` — grid of stalls (empty + listed).  
   - **System stalls**: seed or query instance-owned listings for `bruised-banana`.  
   - **Purchase flow** for slot 9+ with confirm + cost display.

4. **Phase D — Reconcile gameboard**  
   - Option **D1**: Keep `/campaign/board` as **system “featured 8”** (deck draw) with label **separate** from **My stalls**.  
   - Option **D2**: Migrate deck draw to instance-only admin surface; NOW CTA points to **Explore** (map/hub) + **Market** (stalls).  
   - Record decision in spec **Design Decisions** table update when chosen.

## File impacts (expected)

| Area | Files / patterns |
|------|------------------|
| Actions | New `src/actions/campaign-marketplace-slots.ts` (or under `event-campaign-engine` if merged) |
| Schema | `prisma/schema.prisma` — new model(s); migration |
| UI | `src/app/campaign/marketplace/page.tsx` (new), hub/board copy tweaks, Hand components |
| Seeds | System stall seed script; cert quest already in `seed-cyoa-certification-quests.ts` |
| Tests | Unit tests for cap logic and attach permissions |

## Verification quest

- **Slug**: `cert-campaign-marketplace-slots-v1`  
- **Seed**: `scripts/seed-cyoa-certification-quests.ts`  
- **npm**: `npm run seed:cert:campaign-marketplace-slots`

## Risks

- **Duplicating** `GameboardSlot` semantics — mitigate with **explicit** `slotKind` or separate table.  
- **Empty UI** — ship **FR-C1** before removing old board prominence.

## Open questions

- [ ] Slot scope: per player globally vs per `campaignRef`.  
- [ ] Exact vibeulon cost curve for slot 9+.  
- [ ] Whether **listing** creates a new `CustomBar` visibility or only references existing quest/BAR.

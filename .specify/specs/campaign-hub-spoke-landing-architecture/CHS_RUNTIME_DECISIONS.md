# CHS runtime decisions (logged)

Canonical spec: [spec.md](./spec.md). This file records **implementation choices** so tasks stay unblocked without re-interviewing.

---

## CYOA progress persistence (portal vs intake spoke)

| Surface | Current behavior | CHS option mapping | Next step |
|---------|------------------|-------------------|-----------|
| **Campaign portal adventure** (`Instance.portalAdventureId`, `Portal_1`…`Portal_8`) | `PlayerAdventureProgress` saves `currentNodeId` per player+adventure ([`saveAdventureProgress`](../../../src/actions/adventure-progress.ts)). | **(B) partial:** On each `GET` node, **Room_*** choices are **revalidated** against current `Instance.schoolsAdventureId` — **Grow Up → `schools`** is omitted when no schools adventure is linked ([`revalidateCampaignPortalRoomChoices`](../../../src/lib/cyoa/filter-choices.ts), wired in [`adventures/[slug]/[nodeId]/route.ts`](../../../src/app/api/adventures/[slug]/[nodeId]/route.ts)). Further revalidation (alchemy tags, spoke mismatch) can extend the same hook. |
| **CYOA_SPOKE** (intake-generated adventures) | Cached adventures; player navigates like any adventure; progress uses same progress table when same player slug. | Short graphs: **(A)-like** acceptable; for longer AI spokes, prefer full **(B)** with revalidation. | Document spoke max length in [TEMPLATE_INDEX.md](./TEMPLATE_INDEX.md); implement B when intake passages gain alchemy gates. |

**Recorded choice:** No change to spec table ordering — **default recommendation remains (B)** for maturity; **portal is implemented as persisted checkpoint without revalidation** until a follow-up task adds it.

---

## Alchemy trace storage (v1)

| Layer | Decision |
|-------|----------|
| **v1** | **JSON on `Player.storyProgress.state`** — hub journey keys written by [`hub-journey-state.ts`](../../../src/lib/campaign-hub/hub-journey-state.ts) and consumed by [`pickGmLensFromStoryState`](../../../src/lib/bar-quest-generation/emotional-alchemy.ts) + deck code. |
| **Privacy** | Same as existing `storyProgress` — player-scoped; not exposed in public APIs without auth. |
| **v2 (optional)** | Dedicated `PlayerCampaignAlchemyTrace` (or similar) if stewards need audit timelines or GDPR export slices separate from omnibus JSON. **Not required for CHS MVP.** |

---

## Deck topology `BAR52` | `CAMPAIGN64`

**Status:** Open — no enum in schema yet. When added, link `Instance` or deck record from [campaign-domain-decks](../campaign-domain-decks/spec.md).

---

## Related

- [SMB spoke-move-seed-beds](../spoke-move-seed-beds/spec.md) — spoke completion + BAR gates + nursery (downstream).

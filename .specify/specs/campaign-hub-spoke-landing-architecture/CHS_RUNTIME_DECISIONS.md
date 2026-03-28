# CHS runtime decisions (logged)

Canonical spec: [spec.md](./spec.md). This file records **implementation choices** so tasks stay unblocked without re-interviewing.

---

## CYOA progress persistence (portal vs intake spoke)

| Surface | Current behavior | CHS option mapping | Next step |
|---------|------------------|-------------------|-----------|
| **Campaign portal adventure** (`Instance.portalAdventureId`, `Portal_1`…`Portal_8`) | `PlayerAdventureProgress` saves `currentNodeId` per player+adventure ([`saveAdventureProgress`](../../../src/actions/adventure-progress.ts)). | **(B) partial:** On each `GET` node, **Room_*** choices are **revalidated** against current `Instance.schoolsAdventureId` — **Grow Up → `schools`** is omitted when no schools adventure is linked ([`revalidateCampaignPortalRoomChoices`](../../../src/lib/cyoa/filter-choices.ts), wired in [`adventures/[slug]/[nodeId]/route.ts`](../../../src/app/api/adventures/[slug]/[nodeId]/route.ts)). Further revalidation (alchemy tags, spoke mismatch) can extend the same hook. |
| **CYOA_SPOKE** (intake-generated adventures) | Cached adventures; player navigates like any adventure; progress uses same progress table when same player slug. | Short graphs: **(A)-like** acceptable; for longer AI spokes, prefer full **(B)** with revalidation. | Document spoke max length in [TEMPLATE_INDEX.md](./TEMPLATE_INDEX.md); implement B when intake passages gain alchemy gates. |

**Recorded choice:** No change to spec table ordering — **default recommendation remains (B)** for maturity; **portal uses persisted checkpoint + partial revalidation** (Room_* / schools link today; extend the same hook for alchemy/spoke rules).

---

## Alchemy trace storage (v1)

| Layer | Decision |
|-------|----------|
| **v1** | **JSON on `Player.storyProgress.state`** — hub journey keys written by [`hub-journey-state.ts`](../../../src/lib/campaign-hub/hub-journey-state.ts) and consumed by [`pickGmLensFromStoryState`](../../../src/lib/bar-quest-generation/emotional-alchemy.ts) + deck code. |
| **Privacy** | Same as existing `storyProgress` — player-scoped; not exposed in public APIs without auth. |
| **v2 (optional)** | Dedicated `PlayerCampaignAlchemyTrace` (or similar) if stewards need audit timelines or GDPR export slices separate from omnibus JSON. **Not required for CHS MVP.** |

---

## Deck topology (52 vs 64 slots)

**Status:** **Shipped (v1 schema + admin)** — `Instance.campaignDeckTopology`: Prisma enum `CAMPAIGN_DECK_52` | `CAMPAIGN_DECK_64` (column `campaign_deck_topology`, default `CAMPAIGN_DECK_52`). Admin: **Instances** create + edit forms. Helpers: `src/lib/campaign-deck-topology.ts`. Further work: bind slots table / draw pool, template validation by topology. See [campaign-domain-decks](../campaign-domain-decks/spec.md).

**Path B (chosen):** **Canonical runtime spine** (spoke index, period, instance); **52 vs 64** affects **slot grid, labels, and template families** — not duplicate routing trees. **Binding:** fixed 52 or 64 slots; **draw only from bound slots**; empty slots are valid. **Creator copy** (story paragraphs + council one-liners + **Diplomat** user-language blurb): [spec.md § Deck topology: story affordances](./spec.md#campaign-deck-topology-story-affordances-creator-copy).

---

## Landing-first before portal CYOA (SCL-B7)

**Status:** **Shipped (routing v1)** — default entry from **campaign hub** and **spatial hub portal modal** opens **`/campaign/landing?ref=&spoke=`** first; **“Enter CYOA directly →”** remains for power users / QA. **`/campaign/landing`** includes a primary **“Continue into spoke CYOA →”** CTA to **`/campaign/spoke/:index`**, which server-redirects into **`/adventure/:portalId/play`** with `start`, `ref`, `spoke`, `kotterStage`, optional `hexagram` + `face` from **`Instance.campaignHubState`**.

**Login `returnTo`:** Unauthenticated hits to **landing** or **spoke** resolve to **`/login?returnTo=`** the **landing** URL (or hub if spoke index invalid) so post-login orientation stays coherent.

**Single source of truth for hex/face on portal (until URL overrides):** `campaignHubState.spokes[spokeIndex]` when hub state matches Kotter stage — see [`spoke/[index]/page.tsx`](../../../src/app/campaign/spoke/[index]/page.tsx).

---

## Conclave URLs (legacy campaign entry)

**Contract:** [spec.md § Conclave as legacy campaign entry](./spec.md#conclave-as-legacy-campaign-entry) — `/conclave/*` deprecated for **new** entrypoints; **redirect shims** toward hub / login / campaign flows; **tasks:** [tasks.md](./tasks.md) § Navigation — Conclave → campaign.

---

## Related

- [SMB spoke-move-seed-beds](../spoke-move-seed-beds/spec.md) — spoke completion + BAR gates + nursery (downstream).

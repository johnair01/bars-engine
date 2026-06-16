# Throughput Spine — Journey Map & Gap Ledger (Phase 0)

> Phase 0 deliverable for [spec.md](./spec.md). This makes the spine **testable** (every transition
> named with owner + status + exact gap) and records the **schema-reuse decision** (T0.2).

## The spine, as states → transitions → surfaces

```
  CHARGE                    BAR                      ARTIFACT                 COLLECTIVE
   │                         │                         │                         │
 (Wake Up)               (Open/Clean)              (Grow/Show)               (attach + milestone)
   │                         │                         │                         │
   ▼                         ▼                         ▼                         ▼
 capture ──metabolize──▶ a BAR ──tend──▶ a tended BAR ──seed──▶ quest/daemon/artifact ──attach──▶ campaign ──advances──▶ milestone
   /  /capture            321 → BAR        Vault (/hand)         GrowFromBar              "Offer to a campaign"     campaign hub
```

| # | Transition | Surface | Move |
|---|-----------|---------|------|
| T1 | charge → BAR | `/` → `/capture` → 321 | Wake → Open/Clean |
| T2 | BAR → tended BAR | Vault (`/hand`) | Grow Up |
| T3 | tended BAR → quest/daemon/artifact | `GrowFromBar` | Show Up |
| T4 | quest/BAR → **attached to a campaign** | BAR/quest detail + Vault → hub | (bridge) |
| T5 | attached work → **advances a milestone** | campaign hub | (collective) |
| T6 | steward **authors** a well-crafted milestone | campaign admin/hub | (collective) |

## Gap ledger — each transition: owner · status · the exact gap

| # | Status | Owning spec / code | The exact gap (what blocks "walkable") |
|---|--------|--------------------|----------------------------------------|
| **T1** capture → BAR | 🟢 works | `/capture`, `charge-capture.ts`, 321 | None functional. *Frame polish:* charge→quest provenance invisible (Phase 4). |
| **T2** tend in Vault | 🟡 partial | `vault-*`, BRS (`personal-ops-funnel`) | No **"tend"** action (incremental develop); only edit/compost. Build in Phase 5 (BRS). |
| **T3** seed | 🟢 quest+daemon / 🟠 artifact | `GrowFromBar`, `growQuestFromBar`/`growDaemonFromBar`/`growArtifactFromBar` | Works for quest+daemon; artifact = generic GrowthScene only. **Phase 1:** make it read as one "Show Up / seed" move; lock MVP set. |
| **T4** attach to campaign | 🔴 **missing (link 1)** | NEW `campaign-attach.ts` | No player affordance to declare "this is for campaign X." **Phase 2.** |
| **T5** advance milestone | 🟡 implicit | `campaign-contributions.ts`, `campaign-milestone-guidance.ts` | Contribution rollup exists once an annotation exists; needs T4 to feed it explicitly. Surfaces on hub already. |
| **T6** author milestone | 🔴 **missing (link 2)** | NEW `campaign-milestone-authoring.ts` | Model is complete; **zero authoring UX** + no celebration wiring. **Phase 3.** |

**Conclusion:** the spine is broken at exactly **two points — T4 (attach) and T6 (milestone authoring)**.
Everything else either works (T1, T3-quest/daemon, T5) or is a frame-polish item already owned by an
existing spec (T2 Vault, T1/T4 Now polish). Closing T4 + T6 makes the spine **walkable**; the frames
make it **ergonomic**.

## T0.2 — Schema-reuse decision: **NO new fields required for v1**

Both missing links build entirely on **existing models**. Confirmed against `prisma/schema.prisma`:

### Link 1 — Attach-to-campaign (T4)
- **`CustomBar.campaignRef: String?`** already exists → setting it = "this BAR/quest belongs to campaign X."
- **`ContributionAnnotation`** (`campaignRef`, `actionType` `quest|bar|…`, `actionId`, `gmLabel`,
  `createdById`, `status`, unique `[campaignRef, actionType, actionId]`) → a player declaring intent
  creates an annotation (`actionType='bar'|'quest'`, `createdById = player`, `gmLabel = intent note`).
  This is what the hub's contribution rollup already reads.
- **`ContributionRecord`** handles the earned rollup on completion — unchanged.
- → **Reuse.** `attachBarToCampaign` = set `campaignRef` + upsert a `ContributionAnnotation`.
  *Optional future field (deferred):* `ContributionAnnotation.source: 'gm' | 'player'` to distinguish
  player-declared from GM-curated. Not needed for v1 (can infer from `createdById` = the BAR's owner).

### Link 2 — Milestone authoring + celebration (T6)
- **`CampaignMilestone`** already models the full lifecycle: `title`, `description` (the "why it
  matters" narrative), `targetValue`/`currentValue`, `status` (`proposed|active|complete`),
  `proposedByPlayerId`, `approvedByPlayerId`/`approvedAt`. → propose → approve **already expressible**.
- **`CampaignMilestoneMarker`** (`triggerCount`, `narrativeText`, `sortOrder`, `status`) already exists
  as the **"show this narrative when N reached"** mechanism → this **is** the celebration/reach-narrative
  surface. Authoring a milestone's celebration = authoring a Marker.
- → **Reuse.** `proposeMilestone` / `updateMilestoneCraft` / `approveMilestone` write
  `CampaignMilestone`; the celebration writes `CampaignMilestoneMarker`. *Optional future field
  (deferred):* a direct `CampaignMilestone.celebration` if we later want 1:1 coupling instead of the
  Marker's count-trigger model.

### Decision
**Phases 1–3 require no migration.** Proceed actions-and-UI-only over `CustomBar.campaignRef`,
`ContributionAnnotation`/`ContributionRecord`, `CampaignMilestone`, and `CampaignMilestoneMarker`.
Revisit the two optional fields only if the UX proves they're needed — at which point the normal
`prisma migrate dev` + committed-migration discipline applies.

## Recommended build sequence (unchanged, now confirmed cheap)
1. **Phase 2 — attach (T4)** and **Phase 3 — milestone authoring (T6)**: pure actions + UI, **no DB
   migration**. These close the spine.
2. **Phase 1 — seed coherence (T3)**: copy + routing on `GrowFromBar`.
3. **Phases 4–5 — Now + Vault frames**: drive existing specs to acceptance.
4. **Verification quest `cert-throughput-spine-v1`**: the walkability gate.

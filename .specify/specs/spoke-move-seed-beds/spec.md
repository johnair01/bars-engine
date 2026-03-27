# Spec: Spoke move seed beds (player campaign kernels from hub spokes)

## Purpose

Let **any player** who reaches the **plant / nursery** surface after (or alongside) **campaign hub spokes** create and nurture **`campaign_kernel`** seeds using **BARs** as input — with **four fixed beds per spoke** aligned to **personal throughput moves** (Wake Up, Clean Up, Grow Up, Show Up). **First mover per `(campaignRef, spokeIndex, moveType)`** may anchor the **official spoke BAR** for that bed; later players **plant additional** kernels and/or **water** existing ones. Longer term, beds support **versioning / forest exploration** (forks, lineage) without breaking the four-slot grammar.

**Problem:** Hub → spoke → BAR is a strong ritual, but **downstream collective creation** (new campaign soil) is admin-heavy today (`createCampaignSeed` in [`src/actions/campaign-bar.ts`](../../../src/actions/campaign-bar.ts)). Players need a **legible, flow-preserving** path from **spoke fruit** to **waterable seeds**.

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Slot model | **Four beds per spoke** — keys `wakeUp \| cleanUp \| growUp \| showUp` scoped by **`campaignRef` + `spokeIndex` (0–7)**. |
| First mover | **Per `(campaignRef, spokeIndex, moveType)`** — first player to satisfy anchor rules may bind the **canonical spoke BAR** for that bed. |
| BAR source | Any player with access may **plant** using **any BAR they are allowed to use** (e.g. own vault); **anchor** uses the **spoke-emitted BAR** for that move path when eligible. |
| Spoke completion | Spoke **does not complete** until at least one **qualifying spoke BAR** exists; **progress does not persist** until BAR emit succeeds — player must **replay** if they abandon before BAR. |
| Abundance | **Interpretation B:** multiple `campaign_kernel` entries **per bed** over time; **Interpretation C** (later): version / fork lineage within a bed. |
| Quality & jokes | **Joke BARs** allowed socially; **seed promotion / visibility** uses **quality gates**; **admin / stewards / NPCs** may **override** or **offer alternate paths**. |
| Watering | Reuse **six-face watering** on `campaign_kernel` where it already applies ([`advanceCampaignWatering`](../../../src/actions/campaign-bar.ts), `promoteCampaignBarToInstance` when complete). |

## Conceptual Model

```text
Campaign (Instance / campaignRef)
  └─ Hub spoke index 0..7
       └─ Move bed: wakeUp | cleanUp | growUp | showUp   ← exactly 4 per spoke
            ├─ anchor: optional { spokeBarId, anchoredByPlayerId, anchoredAt }  // first mover
            ├─ kernels: campaign_kernel[]                 // many plants (B); lineage (C) later
            └─ water: existing campaign-bar watering model
```

**WHO:** Player (any logged-in). **WHAT:** BAR → `campaign_kernel`. **WHERE:** Campaign + spoke + move bed. **Personal throughput:** the four moves define **beds**, not optional tags.

## API Contracts (API-First)

> Define shapes before UI. Prefer **Server Actions** for mutations; **GET** route or RSC loader for bed state.

### `getSpokeMoveBeds`

**Input:** `{ campaignRef: string; spokeIndex: number }`  
**Output:** `{ beds: Record<MoveType, BedState> }` where `BedState` includes `anchor`, `kernels: { id, title, createdAt, creatorId }[]`, and aggregated watering summary if cheap.

```ts
// Example — refine at implementation
declare function getSpokeMoveBeds(input: {
  campaignRef: string
  spokeIndex: number
}): Promise<{ beds: Record<IntakeMoveType, BedSnapshot> }>
```

### `plantKernelFromBar`

**Input:** `{ campaignRef; spokeIndex; moveType; barId; intent: 'anchor_spoke_bar' | 'additional' }`  
**Output:** `{ success: true; kernelId: string } | { error: string }`

- Validates **player may use `barId`**.
- If `intent === 'anchor_spoke_bar'`: enforce **first-mover empty anchor** for that triple; enforce **bar is the spoke BAR** for that `(spoke, move)` (provenance link TBD — see plan).
- If `intent === 'additional'`: create new `campaign_kernel` linked to bed without claiming anchor.
- Applies **quality / length** rules for kernel body (exact thresholds in tasks).

### `adminReassignBedAnchor` (or extend existing admin campaign-bar tools)

**Input:** `{ bedKey; newAnchorBarId | null; reason }`  
**Output:** success | error  

- **Admin / steward** (role matrix in tasks) can fix griefing or mistakes.

### Route vs Action

| Surface | Mechanism |
|---------|-----------|
| Plant / nursery UI | Server Actions: `getSpokeMoveBeds`, `plantKernelFromBar`, `advanceCampaignWatering` (existing) |
| Optional share / deep link | `GET` page under `/campaign/...` — RSC loads `getSpokeMoveBeds` |

## User Stories

### P1 — Complete spoke, must fruit

**As a** player, **I want** my spoke path to **require** a BAR before it counts as done, **so** the ritual has closure and downstream systems can trust the artifact.

**Acceptance:** Without a successful BAR emit tied to the spoke session, **adventure progress** for that spoke attempt does not **commit**; returning user **replays** from hub entry or last non-terminal node per implementation choice (document in plan).

### P2 — First mover anchors spoke BAR

**As the** first player to satisfy anchor rules for `(campaign, spoke, move)`, **I want** to **plant** using the **spoke BAR** as the root seed for that bed, **so** the collective has a clear flagship per move slot.

**Acceptance:** Second player cannot claim `anchor_spoke_bar` for same triple; UI offers **additional plant** or **water** instead.

### P3 — Anyone plants with any BAR

**As a** later visitor, **I want** to **plant** a new kernel from **any BAR I own** (or policy allows), **so** the nursery can grow many trees in the same four beds.

**Acceptance:** New `campaign_kernel` rows appear under correct bed; list visible on nursery UI.

### P4 — Water existing seeds

**As a** player, **I want** to **water** kernels (six-face model) **so** promotion toward Instance remains possible per existing campaign-bar rules.

**Acceptance:** Completing watering quests advances `advanceCampaignWatering`; stewards/admins retain override.

### P5 — Governance

**As an** admin, **I want** to **reassign or archive** bad-faith seeds, **so** joke BARs don’t permanently block collective flow.

**Acceptance:** Documented action + audit trail (minimal: `updatedAt` + admin id in Phase 1).

### P6 — Verification quest

**As a** steward, **I want** a **cert quest** that walks hub → spoke → BAR → plant → water, **so** we can verify the slice before residency stress.

**Acceptance:** `cert-spoke-move-seed-beds-v1` seeded; steps in plan/tasks.

## Functional Requirements

### Phase 1 — Vertical slice (one campaign, one spoke)

- **FR1**: Data model for **bed identity** `(campaignRef, spokeIndex, moveType)` and **optional anchor** + **kernel list** (new table(s) or disciplined JSON on `Instance` — see plan).
- **FR2**: **Spoke completion gate** — no durable “finished spoke” without **spoke BAR**; align with portal adventure + `PlayerAdventureProgress` / hub journey state ([CHS](../campaign-hub-spoke-landing-architecture/spec.md)).
- **FR3**: **Server action** `plantKernelFromBar` with **first-mover** and **BAR eligibility** checks.
- **FR4**: **Nursery UI** — landing page or hub sub-route showing **four beds** for current spoke; list kernels; CTAs plant / water.
- **FR5**: **Quality gate** on kernel text (min length, banned empty; optional steward review flag).
- **FR6**: **Admin override** path for anchor reassignment or kernel archive.

### Phase 2 — All spokes + polish

- **FR7**: Expose beds for **all eight spokes** from hub / landing navigation.
- **FR8**: Shareable **deep link** to a specific bed.
- **FR9**: **Lineage / version** hooks for interpretation **C** (defer heavy UX).

## Non-Functional Requirements

- **Security:** Plant/water actions **auth-checked**; BAR use limited to owner or explicit share rules.
- **Performance:** `getSpokeMoveBeds` bounded queries; index `(campaignRef, spokeIndex)`.
- **Copy:** Player-facing language avoids “kernel” where possible — prefer **seed**, **bed**, **water**, **grow**.

## Verification Quest

- **ID:** `cert-spoke-move-seed-beds-v1`
- **Steps:** (1) Open campaign hub. (2) Enter one spoke; complete path; emit BAR. (3) Open nursery for that spoke; confirm four beds visible. (4) Plant **anchor** with spoke BAR as first mover. (5) Second account or incognito: plant **additional** with another BAR. (6) Start watering face on one kernel. (7) Admin: demonstrate override or document stub.
- **Framing:** Bruised Banana fundraiser / residency readiness — verify collective creation path before party scale.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md), `scripts/seed-cyoa-certification-quests.ts`

## Dependencies

- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — hub, spokes, portal CYOA, landings.
- [`src/actions/campaign-bar.ts`](../../../src/actions/campaign-bar.ts) — `campaign_kernel`, `advanceCampaignWatering`, `promoteCampaignBarToInstance`.
- [campaign-branch-seeds](../campaign-branch-seeds/spec.md) — related **plant/water** metaphor at passage level; avoid duplicate UX without intentional merge.

## References

- [`src/actions/campaign-bar.ts`](../../../src/actions/campaign-bar.ts)
- [`src/lib/campaign-hub/hub-journey-state.ts`](../../../src/lib/campaign-hub/hub-journey-state.ts) — hub journey context on player
- [campaign-creation-kernel](../campaign-creation-kernel/spec.md) — **different feature** (admin EventCampaign kernel button); do not conflate names

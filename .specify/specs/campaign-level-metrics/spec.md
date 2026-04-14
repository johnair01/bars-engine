# Spec: Campaign-Level Metrics — Cross-Cutting Outcome Tracking

## Purpose

Define how campaigns track cross-cutting outcomes that span the entire campaign lifetime and don't belong to any single spoke. Examples from MTGOA Organization: "number of effective allies in the world," "ally effectiveness level," "self-reported player satisfaction." These are observability signals that measure whether the campaign is succeeding *in aggregate*, not whether any specific milestone is met.

## Problem

Milestones measure spoke-level progress: "Did we ship the book?" "Did we form the nonprofit?" But MTGOA Organization also has goals like "consistently increase the number of effective allies." That goal isn't a milestone — it's a continuous outcome metric that:

- Spans every spoke and every player action
- Has no completion state ("done" doesn't apply)
- Is measured over time, not at a single point
- Should inform campaign owners but never gate anything

The current system has no way to express or track these. Owners would have to either bury them inside individual spoke milestones (where they don't fit) or ignore them entirely (where the most important outcomes go unmeasured).

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Metrics ≠ milestones | Metrics are observability, not gates. They never block campaign progression or unlock content. Milestones do that. |
| Metric types | Three types: `counter` (monotonic count), `gauge` (current value, can go up or down), `aggregate` (computed from a set of inputs, like average satisfaction). |
| Data sources | Three source types: `system-derived` (calculated from existing data), `player-reported` (players submit values), `owner-reported` (campaign owner enters values manually). |
| Sampling cadence | Each metric defines its own cadence: `continuous` (updated on every change), `daily`, `weekly`, `monthly`, `manual`. |
| Time-series storage | Metrics store snapshots over time, not just current value. Enables trend visualization. Snapshots are append-only. |
| Privacy default | Metrics are visible to campaign owner by default. Player visibility is per-metric opt-in. |
| Targets are aspirational | Metrics may have targets, but missing a target is never a failure state. Targets are for orientation, not judgment. |
| No metric required | Campaigns can have zero metrics. Metrics are entirely optional. |
| Relationship to feelings | Metrics may be tagged with completion feelings (Triumph, Poignance, Bliss, Peace, Excitement) so progress on them produces the right satisfaction signals. |
| Cross-campaign aggregation | Metrics belong to a single campaign. No cross-campaign rollup. (Future work if needed.) |
| Decay/staleness | Player-reported metrics flag as stale after 2× their cadence period if no new data arrives. Stale flags inform owners but don't change the value. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|-------------|
| **WHO** | Campaign owners (always see metrics), players (see opt-in metrics, contribute reports) |
| **WHAT** | Metric definitions, snapshots, time series |
| **WHERE** | Metrics scoped to a single `campaignRef` |
| **Energy** | Metrics measure outcomes, not energy. Charge/BARs feed milestone progress, not metric values. |
| **Personal throughput** | WAVE moves don't directly contribute to metrics — metrics are derived from cumulative effects of moves over time |

### Metric Types

```
counter:
  - Monotonic (only goes up)
  - Examples: total players onboarded, total events held, total quests completed
  - Source: system-derived (counting existing records)

gauge:
  - Can go up or down
  - Examples: active chapter count, monthly active players, current grant funding balance
  - Source: system-derived OR owner-reported

aggregate:
  - Computed from a set of inputs
  - Examples: average satisfaction (from N player surveys), median ally effectiveness score
  - Source: player-reported (each input is a survey response, aggregated)
```

### Time Series Model

```
Metric "average_player_satisfaction" (aggregate, weekly cadence)
  ├── 2026-04-10: 7.2 (from 23 reports)
  ├── 2026-04-17: 7.5 (from 31 reports)
  ├── 2026-04-24: 7.8 (from 28 reports)
  └── ...

Stored as append-only MetricSnapshot rows.
Current value = most recent snapshot.
Trend = derived from last N snapshots.
```

### Source-to-Snapshot Pipeline

```
system-derived:
  Trigger: scheduled or event-based
  Process: query existing data, compute value, write snapshot
  Example: nightly count of CampaignInstance records linked to MTGOA → onboarded count

player-reported:
  Trigger: player submits a report (in-game form, prompt, or quest completion)
  Process: store individual report, recompute aggregate, write snapshot
  Example: post-event satisfaction survey → aggregated into weekly metric

owner-reported:
  Trigger: owner manually enters value via campaign dashboard
  Process: store as snapshot directly
  Example: owner enters monthly grant funding total
```

## API Contracts

### Metric Definition

```typescript
type MetricType = 'counter' | 'gauge' | 'aggregate'
type MetricSource = 'system-derived' | 'player-reported' | 'owner-reported'
type MetricCadence = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'manual'

interface CampaignMetric {
  id: string
  campaignRef: string
  key: string                          // unique within campaign, e.g., "active_allies"
  label: string                        // display name
  description: string                  // owner explanation
  type: MetricType
  source: MetricSource
  cadence: MetricCadence
  unit: string                         // 'count', 'percent', 'score', 'usd', etc.
  target?: number                      // optional aspirational target
  visibleToPlayers: boolean
  feelingTags: Array<'Triumph' | 'Poignance' | 'Bliss' | 'Peace' | 'Excitement'>
  
  // For system-derived only
  derivationConfig?: {
    sourceTable: string                // e.g., 'CampaignInstance'
    aggregation: 'count' | 'sum' | 'avg' | 'max' | 'min'
    filter?: Record<string, unknown>
  }
  
  // For player-reported only
  reportConfig?: {
    promptText: string                 // shown to players when reporting
    inputType: 'number' | 'scale-1-10' | 'scale-1-5'
    aggregationFn: 'avg' | 'median' | 'sum' | 'count'
  }
}

// Define a new metric
action defineCampaignMetric(input: {
  campaignRef: string
  metric: Omit<CampaignMetric, 'id'>
}): {
  metric: CampaignMetric
}

// Update metric configuration (does NOT modify historical snapshots)
action updateCampaignMetric(input: {
  metricId: string
  updates: Partial<Omit<CampaignMetric, 'id' | 'campaignRef' | 'key'>>
}): {
  metric: CampaignMetric
}

// List all metrics for a campaign
action listCampaignMetrics(input: {
  campaignRef: string
  visibleToPlayer?: boolean            // filter for player view
}): {
  metrics: CampaignMetric[]
}
```

### Snapshot Recording

```typescript
interface MetricSnapshot {
  id: string
  metricId: string
  value: number
  reportCount?: number                 // for aggregate metrics
  recordedAt: Date
  recordedBy?: string                  // userId for owner/player reports, null for system
  source: MetricSource
}

// Record a snapshot (called by system jobs, player reports, or owner input)
action recordMetricSnapshot(input: {
  metricId: string
  value: number
  reportCount?: number
  recordedBy?: string
}): {
  snapshot: MetricSnapshot
}

// Submit a player report (for player-reported metrics)
// Internally: stores individual report, recomputes aggregate, writes snapshot
action submitPlayerMetricReport(input: {
  metricId: string
  playerId: string
  value: number
}): {
  reportRecorded: true
  newAggregateSnapshot?: MetricSnapshot  // present if cadence triggered new snapshot
}

// Query snapshots over time
action getMetricSnapshots(input: {
  metricId: string
  fromDate?: Date
  toDate?: Date
  limit?: number                       // default 100
}): {
  snapshots: MetricSnapshot[]
  currentValue: number                 // most recent snapshot value
  trend: {
    direction: 'up' | 'down' | 'flat'
    deltaPercent: number               // change vs. earliest in range
  }
  staleness: {
    isStale: boolean
    lastReportAt?: Date
    expectedNextReportBy?: Date
  }
}
```

### Player Reports (Individual Submissions)

```typescript
interface PlayerMetricReport {
  id: string
  metricId: string
  playerId: string
  value: number
  submittedAt: Date
}

// Get individual reports (for audit/owner view, not aggregated)
action getPlayerReportsForMetric(input: {
  metricId: string
  playerId?: string                    // filter by player
  limit?: number
}): {
  reports: PlayerMetricReport[]
}
```

### Aggregation & Recomputation

```typescript
// Trigger system-derived metric recomputation (idempotent, safe to run anytime)
action recomputeSystemMetric(input: {
  metricId: string
}): {
  newSnapshot: MetricSnapshot
  previousValue: number
  delta: number
}

// Recompute aggregate from player reports (called automatically on cadence boundary)
action recomputeAggregateMetric(input: {
  metricId: string
}): {
  newSnapshot: MetricSnapshot
  reportCount: number
  windowStart: Date
  windowEnd: Date
}
```

## User Stories

### P0 — Core Metrics

**CM-1**: As a campaign owner, I can define a metric for my campaign without it gating anything, so I can track outcomes I care about.

*Acceptance*: Metric definition succeeds. Metric does not appear in milestone or completion gating logic. Campaign progression is unaffected by metric values.

**CM-2**: As a campaign owner, I can choose whether each metric is visible to players, so I can control information surface area.

*Acceptance*: `visibleToPlayers: false` metrics never appear in player-facing UI. `visibleToPlayers: true` metrics appear in player campaign view.

**CM-3**: As a campaign owner, I see metric values and trends in my campaign dashboard, so I can observe outcomes over time.

*Acceptance*: Dashboard shows current value, trend direction, and historical chart for each metric.

**CM-4**: As a campaign owner, I can tag metrics with completion feelings, so I know which metrics produce which kinds of satisfaction when they improve.

*Acceptance*: `feelingTags` field is settable on metric definition. Tags appear in metric display.

### P1 — Data Sources

**CM-5**: As a system, I can recompute system-derived metrics on a schedule or on demand, so values stay current without manual intervention.

*Acceptance*: `recomputeSystemMetric` action queries underlying data and writes new snapshot. Idempotent.

**CM-6**: As a player, I can submit reports for player-reported metrics when prompted, so the campaign can measure subjective outcomes.

*Acceptance*: `submitPlayerMetricReport` accepts player input. Individual report stored. Aggregate recomputed on cadence boundary.

**CM-7**: As a campaign owner, I can manually enter values for owner-reported metrics, so I can track things the system can't measure (e.g., grant funding totals, external partnerships).

*Acceptance*: Owner dashboard provides manual entry form for owner-reported metrics. Snapshot recorded directly.

### P2 — Trends & Staleness

**CM-8**: As a campaign owner, I can see trend direction (up/down/flat) for each metric, so I understand whether things are getting better.

*Acceptance*: `getMetricSnapshots` returns trend with direction and percent delta. Trend is computed from snapshots in the requested range.

**CM-9**: As a campaign owner, I am alerted when player-reported metrics go stale, so I know data collection has stalled.

*Acceptance*: Metric is flagged stale after 2× cadence period without reports. Stale flag visible in dashboard. Does not change metric value.

### P3 — Optional Targets

**CM-10**: As a campaign owner, I can set an aspirational target for a metric, so I have orientation toward where I want it to go.

*Acceptance*: `target` field is optional. When set, dashboard shows progress toward target. Missing the target produces no error or failure state.

## Functional Requirements

### Phase 1 — Metric Definitions + Snapshots

- **FR1**: Add `CampaignMetric` and `MetricSnapshot` models to schema
- **FR2**: Implement `defineCampaignMetric`, `updateCampaignMetric`, `listCampaignMetrics` actions
- **FR3**: Implement `recordMetricSnapshot` action
- **FR4**: Implement `getMetricSnapshots` action with trend computation
- **FR5**: Enforce metric visibility filtering in player-facing queries

### Phase 2 — System-Derived Metrics

- **FR6**: Implement `recomputeSystemMetric` action with derivation config support
- **FR7**: Build supported aggregation functions (`count`, `sum`, `avg`, `max`, `min`)
- **FR8**: Schedule recomputation per metric cadence (no cron — compute on access for `daily`, `weekly`, `monthly`)
- **FR9**: Validate `derivationConfig` against allowed source tables (whitelist)

### Phase 3 — Player Reports + Aggregation

- **FR10**: Add `PlayerMetricReport` model
- **FR11**: Implement `submitPlayerMetricReport` action
- **FR12**: Implement `recomputeAggregateMetric` action with windowed aggregation
- **FR13**: Implement aggregation functions (`avg`, `median`, `sum`, `count`)
- **FR14**: Trigger aggregate recomputation on cadence boundary

### Phase 4 — Owner Reports + Dashboard

- **FR15**: Implement owner-reported metric submission flow
- **FR16**: Build campaign metrics dashboard component
- **FR17**: Build metric trend chart component
- **FR18**: Build staleness indicator
- **FR19**: Build optional target progress indicator

## Non-Functional Requirements

- **NFR1**: Metric snapshots are append-only (no edits, no deletes)
- **NFR2**: Player metric reports are immutable once submitted
- **NFR3**: Recomputation must be idempotent — running it twice produces the same snapshot
- **NFR4**: Player report submission must be rate-limited per player per metric (default: once per cadence period)
- **NFR5**: System-derived metric queries must use whitelisted source tables only (no arbitrary SQL)
- **NFR6**: Metrics must never appear in milestone or completion gating logic (enforced by separate code paths)

## Persisted Data & Prisma

When schema changes are implemented:
- [ ] Create migration: `npx prisma migrate dev --name add_campaign_metrics`
- [ ] Commit `prisma/migrations/…` with `schema.prisma`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Human review of migration.sql

### Schema Changes

```prisma
model CampaignMetric {
  id                 String   @id @default(cuid())
  campaignRef        String
  key                String
  label              String
  description        String
  type               String   // 'counter'|'gauge'|'aggregate'
  source             String   // 'system-derived'|'player-reported'|'owner-reported'
  cadence            String   // 'continuous'|'daily'|'weekly'|'monthly'|'manual'
  unit               String
  target             Float?
  visibleToPlayers   Boolean  @default(false)
  feelingTags        String[]
  derivationConfig   Json?
  reportConfig       Json?
  createdAt          DateTime @default(now())
  
  snapshots          MetricSnapshot[]
  playerReports      PlayerMetricReport[]
  
  @@unique([campaignRef, key])
}

model MetricSnapshot {
  id            String   @id @default(cuid())
  metricId      String
  value         Float
  reportCount   Int?
  recordedAt    DateTime @default(now())
  recordedBy    String?
  source        String
  
  metric        CampaignMetric @relation(fields: [metricId], references: [id])
  
  @@index([metricId, recordedAt])
}

model PlayerMetricReport {
  id            String   @id @default(cuid())
  metricId      String
  playerId      String
  value         Float
  submittedAt   DateTime @default(now())
  
  metric        CampaignMetric @relation(fields: [metricId], references: [id])
  
  @@index([metricId, submittedAt])
  @@index([playerId, metricId])
}
```

## Dependencies

- [campaign-lifecycle](../campaign-lifecycle/spec.md) — parent spec defining campaigns; metrics are scoped to campaigns

## References

- `src/lib/campaign/types.ts` — campaign types this extends
- `.specify/specs/campaign-lifecycle/spec.md` — parent lifecycle spec
- `.specify/specs/campaign-recursive-nesting/spec.md` — sibling spec for nested campaigns

# Plan: Campaign-Level Metrics

## Overview

Implement metrics in four phases: definitions + snapshots, system-derived metrics, player reports + aggregation, owner reports + dashboard. Each phase is independently shippable.

## Phase 1 — Metric Definitions + Snapshots

**Goal**: Campaigns can define metrics. Snapshots can be recorded and queried.

### Steps

1. **Schema migration**: Add `CampaignMetric` and `MetricSnapshot` models
2. **Definition CRUD**: Implement `defineCampaignMetric`, `updateCampaignMetric`, `listCampaignMetrics`
3. **Snapshot recording**: Implement `recordMetricSnapshot` action
4. **Snapshot query**: Implement `getMetricSnapshots` with trend computation
5. **Visibility filtering**: Player-facing queries must respect `visibleToPlayers`
6. **Tests**: CRUD operations, snapshot recording, trend computation, visibility filtering

### Key Decisions
- Metrics are completely separate from milestones — no shared code paths
- Snapshots are append-only. No update or delete actions exist.
- Trend is computed from query range, not stored. Allows flexible windowing.

### Files
- `prisma/schema.prisma` — model changes
- `src/actions/campaign-metrics.ts` — server actions
- `src/lib/campaign/metrics.ts` — definition + snapshot logic
- `src/lib/campaign/metric-trend.ts` — trend computation

## Phase 2 — System-Derived Metrics

**Goal**: System computes metric values from existing data on a schedule or on demand.

### Steps

1. **Derivation config**: Implement validated source table whitelist
2. **Aggregation functions**: Implement `count`, `sum`, `avg`, `max`, `min` against whitelisted tables
3. **Recompute action**: Implement `recomputeSystemMetric` — queries source, writes snapshot, idempotent
4. **On-access scheduling**: For `daily`/`weekly`/`monthly` cadence, recompute on next access if last snapshot is stale
5. **Continuous cadence**: For `continuous` metrics, recompute on relevant data change events (hooked into existing event system)
6. **Tests**: Each aggregation function, idempotency, on-access scheduling, whitelist enforcement

### Key Decisions
- No cron jobs. Cadence-based recomputation happens on access (similar to lifecycle clock checks).
- Source table whitelist prevents arbitrary SQL. Hardcoded list of allowed tables and columns.
- `continuous` metrics need event hooks; this requires extending existing event/notification system.

### Files
- `src/lib/campaign/system-derived-metrics.ts` — derivation logic
- `src/lib/campaign/metric-source-whitelist.ts` — allowed tables/columns
- `src/lib/campaign/metric-aggregations.ts` — pure aggregation functions

## Phase 3 — Player Reports + Aggregation

**Goal**: Players submit reports for player-reported metrics. System aggregates them on cadence boundaries.

### Steps

1. **Schema migration**: Add `PlayerMetricReport` model
2. **Report submission**: Implement `submitPlayerMetricReport` with rate limiting
3. **Rate limiting**: Per-player per-metric limit based on cadence (default: one report per cadence period)
4. **Aggregate recomputation**: Implement `recomputeAggregateMetric` with windowed aggregation
5. **Aggregation functions**: Implement `avg`, `median`, `sum`, `count` for player reports
6. **Cadence trigger**: Recompute aggregate when cadence period boundary is crossed
7. **Staleness detection**: Flag metrics as stale if no reports within 2× cadence
8. **Tests**: Report submission, rate limiting, aggregate computation, staleness detection

### Key Decisions
- Player reports are immutable. Submitting again within rate limit is rejected.
- Aggregate window is the most recent cadence period (e.g., last 7 days for weekly metrics).
- Staleness is computed at query time, not stored as flag.

### Files
- `prisma/schema.prisma` — PlayerMetricReport model
- `src/actions/campaign-metrics.ts` — extend with report actions
- `src/lib/campaign/player-reports.ts` — report submission + rate limiting
- `src/lib/campaign/aggregate-metrics.ts` — windowed aggregation

## Phase 4 — Owner Reports + Dashboard

**Goal**: Owners can manually enter metric values. Campaign dashboard displays metrics with trends.

### Steps

1. **Owner submission**: Extend `recordMetricSnapshot` to support owner-attributed snapshots
2. **Dashboard component**: Build campaign metrics dashboard showing all metrics for a campaign
3. **Trend chart**: Build line chart component for snapshot history
4. **Staleness indicator**: Visual indicator for stale player-reported metrics
5. **Target progress**: Visual indicator for metrics with optional targets
6. **Player view**: Build player-facing metric display (filtered by visibility)
7. **Tests**: Dashboard rendering, chart generation, target display

### Key Decisions
- Dashboard is owner-only. Player view is a separate, simpler component.
- Trend chart uses existing chart library (no new dependencies).
- Target progress shows distance, not pass/fail.

### Files
- `src/components/campaign-dashboard/MetricsPanel.tsx`
- `src/components/campaign-dashboard/MetricCard.tsx`
- `src/components/campaign-dashboard/MetricTrendChart.tsx`
- `src/components/campaign-dashboard/PlayerMetricsView.tsx`

## Verification

After each phase:
- `npm run build` — passes
- `npm run check` — passes
- Unit tests for aggregation functions, trend computation, rate limiting

## Risk Notes

- **Source table whitelist maintenance**: As new tables are added, the whitelist needs updates. This is a known maintenance cost in exchange for SQL injection safety.
- **Continuous metrics performance**: Hooking into every relevant event could be expensive. Consider sampling or batching for high-volume events.
- **Staleness false positives**: Player reports may legitimately pause (vacation, low engagement). Staleness alerts should be tunable per metric.
- **Metric proliferation**: Owners may define many metrics. Dashboard needs to handle 10+ metrics gracefully.

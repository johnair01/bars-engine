# Tasks: Campaign-Level Metrics

## Phase 1 — Metric Definitions + Snapshots

- [ ] **T1.1** Add `CampaignMetric` and `MetricSnapshot` models to `prisma/schema.prisma`
- [ ] **T1.2** Create migration: `npx prisma migrate dev --name add_campaign_metrics`
- [ ] **T1.3** Run `npm run db:sync` and `npm run check`
- [ ] **T1.4** Implement `defineCampaignMetric` server action in `src/actions/campaign-metrics.ts`
- [ ] **T1.5** Implement `updateCampaignMetric` server action
- [ ] **T1.6** Implement `listCampaignMetrics` server action with visibility filtering
- [ ] **T1.7** Implement `recordMetricSnapshot` server action
- [ ] **T1.8** Implement `getMetricSnapshots` server action with windowed query
- [ ] **T1.9** Implement trend computation in `src/lib/campaign/metric-trend.ts`
- [ ] **T1.10** Write tests for metric CRUD
- [ ] **T1.11** Write tests for snapshot recording (append-only behavior)
- [ ] **T1.12** Write tests for trend computation
- [ ] **T1.13** Write tests for visibility filtering
- [ ] **T1.14** `npm run build` + `npm run check` pass

## Phase 2 — System-Derived Metrics

- [ ] **T2.1** Define source table whitelist in `src/lib/campaign/metric-source-whitelist.ts`
- [ ] **T2.2** Implement aggregation functions (`count`, `sum`, `avg`, `max`, `min`) in `src/lib/campaign/metric-aggregations.ts`
- [ ] **T2.3** Implement `recomputeSystemMetric` server action with whitelist enforcement
- [ ] **T2.4** Implement on-access scheduling for `daily`/`weekly`/`monthly` cadence (compute if stale)
- [ ] **T2.5** Implement event hooks for `continuous` cadence metrics
- [ ] **T2.6** Validate `derivationConfig` against whitelist on metric creation
- [ ] **T2.7** Write tests for each aggregation function
- [ ] **T2.8** Write tests for idempotency (running recompute twice = same result)
- [ ] **T2.9** Write tests for whitelist enforcement (rejects non-whitelisted tables)
- [ ] **T2.10** Write tests for on-access scheduling
- [ ] **T2.11** `npm run build` + `npm run check` pass

## Phase 3 — Player Reports + Aggregation

- [ ] **T3.1** Add `PlayerMetricReport` model to `prisma/schema.prisma`
- [ ] **T3.2** Create migration: `npx prisma migrate dev --name add_player_metric_reports`
- [ ] **T3.3** Run `npm run db:sync` and `npm run check`
- [ ] **T3.4** Implement `submitPlayerMetricReport` server action
- [ ] **T3.5** Implement rate limiting (per-player per-metric per cadence period)
- [ ] **T3.6** Implement `recomputeAggregateMetric` server action with windowed aggregation
- [ ] **T3.7** Implement aggregation functions for player reports (`avg`, `median`, `sum`, `count`)
- [ ] **T3.8** Implement cadence-boundary trigger for aggregate recomputation
- [ ] **T3.9** Implement staleness detection in `getMetricSnapshots`
- [ ] **T3.10** Implement `getPlayerReportsForMetric` server action
- [ ] **T3.11** Write tests for report submission
- [ ] **T3.12** Write tests for rate limiting
- [ ] **T3.13** Write tests for windowed aggregation
- [ ] **T3.14** Write tests for staleness detection
- [ ] **T3.15** `npm run build` + `npm run check` pass

## Phase 4 — Owner Reports + Dashboard

- [ ] **T4.1** Extend `recordMetricSnapshot` to support owner-attributed snapshots with `recordedBy` field
- [ ] **T4.2** Build owner manual entry form for owner-reported metrics
- [ ] **T4.3** Create `MetricsPanel` component for campaign dashboard
- [ ] **T4.4** Create `MetricCard` component (current value, trend, target progress)
- [ ] **T4.5** Create `MetricTrendChart` component (line chart of snapshots)
- [ ] **T4.6** Create staleness indicator UI element
- [ ] **T4.7** Create target progress indicator (when target is set)
- [ ] **T4.8** Create `PlayerMetricsView` component (player-facing, filtered by visibility)
- [ ] **T4.9** Wire `MetricsPanel` into existing campaign dashboard
- [ ] **T4.10** Wire `PlayerMetricsView` into player campaign view
- [ ] **T4.11** Write tests for dashboard rendering
- [ ] **T4.12** Write tests for chart data generation
- [ ] **T4.13** `npm run build` + `npm run check` pass

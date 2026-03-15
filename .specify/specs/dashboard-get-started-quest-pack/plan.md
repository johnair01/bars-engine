# Plan: Get Started as Wake Up Quest Pack

## Summary

Transform Get Started from a static block into a Wake Up Quest Pack. Phase 1 (done): collapsible, dismissible. Phase 2: visit tracking, completion, vibeulon reward. Phase 3: system quests per page.

## Implementation Order

### Phase 1: Collapsible + Dismissible (Done)

1. GetStartedBlock component — collapsible, dismiss via localStorage
2. Replace static Get Started section with GetStartedBlock

### Phase 2: Visit Tracking + Completion

3. Schema: PlayerGetStartedProgress (playerId, pageKey, visitedAt) or extend existing
4. Track visits to /wiki/bars-guide, /wiki/quests-guide, /wiki/emotional-first-aid-guide, /wiki/donation-guide, /daemons
5. On all 5 visited, mint vibeulon, mark complete
6. When complete, block does not render

### Phase 3: System Quests per Page

7. Define system quests per page (e.g., Create BAR for BARs, Complete EFA for EFA)
8. Wire quest completion to pack progress or bonus vibeulon

## File Impacts

| Action | File |
|--------|------|
| Create | GetStartedBlock.tsx (done) |
| Create | PlayerGetStartedProgress schema (Phase 2) |
| Edit | Visit tracking middleware or page-level (Phase 2) |
| Edit | Completion flow, vibeulon mint (Phase 2) |

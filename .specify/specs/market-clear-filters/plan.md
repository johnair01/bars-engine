# Plan: Market Clear Filters

## Summary

Extend the "Clear all filters" handler on the Market page to also clear `campaignDomainPreference` via `updateCampaignDomainPreference([])` and refetch content.

## Implementation

**File**: `src/app/bars/available/page.tsx`

1. Import `updateCampaignDomainPreference` from `@/actions/campaign-domain-preference`.
2. In the "Clear all filters" button `onClick`:
   - Keep existing: `setSearchQuery('')`, `setActiveStage(null)`, `setSelectedNations([])`, `setSelectedArchetypes([])`.
   - Add: `await updateCampaignDomainPreference([])` then `refreshContent()`.
3. Make the handler `async` and optionally show a brief loading state if desired (minimal UX change).

## Verification

- Set campaign path (e.g. select 2 domains, Save) → Market shows filtered quests.
- Click "Clear all filters" (or trigger it when "No matching commissions found") → all quests reappear.
- Campaign path form shows unchecked / empty state after clear.

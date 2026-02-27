# Prompt: Market Clear Filters (Certification Feedback)

**Use this prompt when fixing the "Clear all filters" behavior on the Market page.**

## Source

Certification feedback from `cert-allyship-domains-v1` (`.feedback/cert_feedback.jsonl`):

> Clear filters didn't remove the filters and bring back filtered out quests

## Prompt text

> Fix the Market page "Clear all filters" button so it actually clears all filters and restores the full quest list. Currently it only clears client-side filters (search, stage, nation, archetype) but does NOT clear the campaign domain preference (`campaignDomainPreference`), which is stored in the DB and applied server-side in `getMarketContent()`. When a player has chosen domains via "Update campaign path", clicking "Clear all filters" should also clear that preference (call `updateCampaignDomainPreference([])`) and refetch content so all quests reappear. See [.specify/specs/market-clear-filters/spec.md](../../specs/market-clear-filters/spec.md).

## Acceptance

- [ ] "Clear all filters" clears search, stage, nation, archetype (existing)
- [ ] "Clear all filters" clears `campaignDomainPreference` (call `updateCampaignDomainPreference([])`)
- [ ] After clearing, `refreshContent()` runs so quests are refetched without domain filter
- [ ] User sees full quest list after clicking "Clear all filters" even when campaign path was set

## Reference

- Spec: [.specify/specs/market-clear-filters/spec.md](../../specs/market-clear-filters/spec.md)
- Market page: [src/app/bars/available/page.tsx](../../../src/app/bars/available/page.tsx)
- Campaign domain action: [src/actions/campaign-domain-preference.ts](../../../src/actions/campaign-domain-preference.ts)
- Market action (server-side domain filter): [src/actions/market.ts](../../../src/actions/market.ts)

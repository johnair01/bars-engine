# Spec: Market Clear Filters (Certification Feedback)

## Purpose

Fix the "Clear all filters" button on the Market page so it clears all filters—including the campaign domain preference—and restores the full quest list. Certification feedback (cert-allyship-domains-v1) reported that "Clear filters didn't remove the filters and bring back filtered out quests."

## Root cause

- **Client-side filters** (search, stage, nation, archetype) are cleared by the button.
- **Campaign domain preference** (`campaignDomainPreference`) is stored in the DB and applied server-side in `getMarketContent()`. The button does not clear it.
- Result: When a player has set domains via "Update campaign path", clicking "Clear all filters" leaves the domain filter active; quests remain filtered.

## User story

**As a tester** (or player), I want "Clear all filters" to remove every filter—including my campaign path domains—and show all quests again, so I can browse the full Market after narrowing it down.

**Acceptance**: Clicking "Clear all filters" clears search, stage, nation, archetype, AND campaign domain preference; the quest list refreshes to show all available quests.

## Functional requirements

- **FR1**: The "Clear all filters" button MUST call `updateCampaignDomainPreference([])` when the player has a `campaignDomainPreference` set (or always call it; it is idempotent when already empty).
- **FR2**: After clearing, the page MUST call `refreshContent()` (or equivalent) to refetch quests from the server without the domain filter.
- **FR3**: Client-side filters (search, stage, nation, archetype) MUST continue to be cleared as today.

## Non-functional requirements

- Minimal change: extend the existing "Clear all filters" handler.
- No schema changes.

## Reference

- Market page: [src/app/bars/available/page.tsx](../../src/app/bars/available/page.tsx)
- Campaign domain action: [src/actions/campaign-domain-preference.ts](../../src/actions/campaign-domain-preference.ts)
- Market action: [src/actions/market.ts](../../src/actions/market.ts)
- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl)

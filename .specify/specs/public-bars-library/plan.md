# Plan: Public BARs in Library

## Overview

Implement Public BARs in the Library as the discovery surface for browsing shared BARs. Distinct from the marketplace (quests to claim). Library = Wake Up; Public BARs = discovery.

## Phases

### Phase 1: Public BARs Page

- [ ] Create `/library/bars` route (or add section to `/library`)
- [ ] Query public CustomBars (visibility: 'public', status: 'active')
- [ ] Display list: title, description, creator, tags
- [ ] Replace "Coming soon" placeholder on Library page with link to Public BARs

### Phase 2: Library Integration

- [ ] Library page links to Public BARs
- [ ] Ensure Game Map → Library → Public BARs flow works

### Phase 3: Polish (Optional)

- [ ] Pagination or load more
- [ ] Filter by tags/domain
- [ ] BAR detail view

## Dependencies

- Game Map and Lobby Navigation (FP)
- Onboarding BARs Wallet (clarifies filters)

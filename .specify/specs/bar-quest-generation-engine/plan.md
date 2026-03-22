# Plan: BAR → Quest Generation Engine v0

## Overview

Implement a governed pipeline that converts BARs (player inspiration) into structured quest proposals. Admin review required before publication. Emotional alchemy resolved via canonical grammar.

## Phases

### Phase 1: Schema + Eligibility
- [ ] Add QuestProposal model (or equivalent) to Prisma
- [ ] BAR eligibility checker (status, title, description, allyshipDomain)
- [ ] Event or action trigger for generation request

### Phase 2: Interpretation + Grammar
- [ ] BAR interpretation layer (derive quest_type, domain, tags)
- [ ] Emotional alchemy resolution (integrate with existing EFA/quest-grammar or new endpoint)
- [ ] Quest proposal construction

### Phase 3: Admin Review + Publication
- [ ] API: POST /bars/:id/generate-quest-proposal
- [ ] API: GET /quest-proposals, POST /quest-proposals/:id/review, POST /quest-proposals/:id/publish
- [ ] Admin UI: proposal list + detail + review actions
- [ ] Publication: create CustomBar quest, link to campaign

### Phase 4: Optional
- [ ] Twine IR publication bridge
- [x] Campaign phase awareness (Kotter stage from Instance; `phase_1_opening_momentum` for stage 1)

## Dependencies

- Transformation Move Registry (FK)
- Quest Grammar (BY)
- Starter Quest Generator (DM)
- Emotional First Aid / Alchemy tooling

# Tasks: Game Rules Wiki Update

## Phase 1: Content Creation

- [x] Create `content/rules/bar-private-public.md` (Private vs Public BARs, membrane rule)
- [x] Create `content/rules/bar-format.md` (Brevity, quadrant, optional tags)
- [x] Create `content/rules/stewardship.md` (Anonymity, adoption, persistence)
- [x] Create `content/rules/decks.md` (Library, Equipped, In Play, Compost, Destroyed)
- [x] Create `content/rules/quests-slots.md` (Slots, FCFS, minting, provenance)
- [x] Create `content/rules/compost.md` (Composting, transformation, expiration, destruction)
- [x] Create `content/rules/slot-offers.md` (Withdrawal, merge, buyout, public override)
- [x] Create `content/rules/capacity.md` (Hand size, refinement progression)
- [x] Create `content/rules/design-principles.md` (P0, P1, P2)
- [x] Create `content/rules/glossary.md` + expand wiki glossary with: BAR, Vibeulon, Quest, Stewardship, Compost, Equipped, In Play, Quadrant

## Phase 2: Wiki Pages

- [x] Create `src/app/wiki/rules/page.tsx` (Rules index with links)
- [x] Create `src/app/wiki/rules/[slug]/page.tsx` (dynamic route rendering markdown)
- [x] Implement markdown loading and rendering (ReactMarkdown)
- [x] Add "Rules" section to `src/app/wiki/page.tsx`
- [x] Expand `src/app/wiki/glossary/page.tsx` with new terms + rules glossary link

## Phase 3: Consistency Check

- [x] Verify no contradictions between minting, compost, equipping, slot claiming
- [x] Tone: dojo/ecology, not bureaucratic or therapeutic
- [x] AQAL only as human-language quadrant (About me, etc.)
- [x] State transitions clear for BARs and vibeulons

## Verification

- [x] `/wiki/rules` displays index
- [x] Each rules subsection accessible and renders
- [x] Glossary includes all required terms
- [ ] Manual: New player can understand the loop from wiki alone

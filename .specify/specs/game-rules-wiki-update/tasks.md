# Tasks: Game Rules Wiki Update

## Phase 1: Content Creation

- [ ] Create `content/rules/bar-private-public.md` (Private vs Public BARs, membrane rule)
- [ ] Create `content/rules/bar-format.md` (Brevity, quadrant, optional tags)
- [ ] Create `content/rules/stewardship.md` (Anonymity, adoption, persistence)
- [ ] Create `content/rules/decks.md` (Library, Equipped, In Play, Compost, Destroyed)
- [ ] Create `content/rules/quests-slots.md` (Slots, FCFS, minting, provenance)
- [ ] Create `content/rules/compost.md` (Composting, transformation, expiration, destruction)
- [ ] Create `content/rules/slot-offers.md` (Withdrawal, merge, buyout, public override)
- [ ] Create `content/rules/capacity.md` (Hand size, refinement progression)
- [ ] Create `content/rules/design-principles.md` (P0, P1, P2)
- [ ] Create or expand glossary with: BAR, Vibeulon, Quest, Stewardship, Compost, Equipped, In Play, Quadrant

## Phase 2: Wiki Pages

- [ ] Create `src/app/wiki/rules/page.tsx` (Rules index with links)
- [ ] Create `src/app/wiki/rules/[slug]/page.tsx` (dynamic route rendering markdown) OR individual page components
- [ ] Implement markdown loading and rendering (ReactMarkdown)
- [ ] Add "Rules" section to `src/app/wiki/page.tsx`
- [ ] Expand `src/app/wiki/glossary/page.tsx` with new terms (or create rules glossary)

## Phase 3: Consistency Check

- [ ] Verify no contradictions between minting, compost, equipping, slot claiming
- [ ] Verify tone: dojo/ecology, not bureaucratic or therapeutic
- [ ] Verify AQAL only as human-language quadrant
- [ ] Verify state transitions are clear for BARs and vibeulons

## Verification

- [ ] `/wiki/rules` displays index
- [ ] Each rules subsection is accessible and renders
- [ ] Glossary includes all required terms
- [ ] New player can understand the loop from wiki alone

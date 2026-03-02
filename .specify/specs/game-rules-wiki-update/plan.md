# Plan: Game Rules Wiki Update

## Summary

Add a coherent "Rules" section to the wiki documenting BAR ecology, decks, quests, vibeulons, compost, and slot market mechanics. Content lives in markdown files; wiki pages render them. No game logic or schema changes.

## Implementation

### Phase 1: Content Structure

**1.1 Create rules content directory**

**Path**: `content/rules/`

Create markdown files as source of truth:
- `bar-private-public.md`
- `bar-format.md`
- `stewardship.md`
- `decks.md`
- `quests-slots.md`
- `compost.md`
- `slot-offers.md`
- `capacity.md`
- `design-principles.md`
- `glossary.md` (or expand existing wiki glossary)

**1.2 Content guidelines**

- Player-facing language; no AQAL jargon
- Dojo/ecology tone; avoid bureaucratic or therapeutic framing
- State machines: clear "what happens when"
- Quadrant: human language (About me, About something happening, About us, About the system)

### Phase 2: Wiki Pages

**2.1 Rules index page**

**File**: `src/app/wiki/rules/page.tsx`

- Lists all rules sections with links
- Brief intro: "How the BAR/Quest/Vibeulon loop works"
- Links to each subsection

**2.2 Rules subsection pages**

**Files**: `src/app/wiki/rules/[slug]/page.tsx` (dynamic) OR individual pages:
- `src/app/wiki/rules/bar-private-public/page.tsx`
- `src/app/wiki/rules/bar-format/page.tsx`
- etc.

**Approach**: Either (a) dynamic route reading from `content/rules/[slug].md` at build time, or (b) static pages with content inline or imported. Prefer markdown files for maintainability.

**2.3 Markdown rendering**

- Use `react-markdown` (already in project)
- Read markdown via `fs.readFileSync` in server component (or `import` if supported)
- Apply `prose prose-invert` or equivalent for readability

### Phase 3: Wiki Index Update

**File**: `src/app/wiki/page.tsx`

- Add "Rules" section with link to `/wiki/rules`
- Or list key rules pages (BARs, Decks, Quests, Compost, etc.)

### Phase 4: Glossary Integration

**Option A**: Expand `src/app/wiki/glossary/page.tsx` with new terms (BAR, Vibeulon, Quest, Stewardship, Compost, Equipped, In Play, Quadrant) — ensure definitions align with rules content.

**Option B**: Create `/wiki/rules/glossary` as a rules-specific glossary page.

### Phase 5: Lore Index Update (Optional)

**File**: `content/lore-index.md`

- Add Rules-related terms if they become proper nouns in the system.

## File Impact Summary

| Action | File |
|--------|------|
| Create | `content/rules/bar-private-public.md` |
| Create | `content/rules/bar-format.md` |
| Create | `content/rules/stewardship.md` |
| Create | `content/rules/decks.md` |
| Create | `content/rules/quests-slots.md` |
| Create | `content/rules/compost.md` |
| Create | `content/rules/slot-offers.md` |
| Create | `content/rules/capacity.md` |
| Create | `content/rules/design-principles.md` |
| Create | `src/app/wiki/rules/page.tsx` |
| Create | `src/app/wiki/rules/[slug]/page.tsx` (or individual pages) |
| Edit | `src/app/wiki/page.tsx` (add Rules section) |
| Edit | `src/app/wiki/glossary/page.tsx` (expand terms) |

## Content Outline (Per Section)

### bar-private-public.md
- Private BARs (notebook): unlimited, freeform, no scarcity
- Public BARs (spellbook): cards in play
- Membrane rule: refinement required to publish

### bar-format.md
- Quadrant (human language)
- Brevity constraint
- Optional tags, Yes/And

### stewardship.md
- Anonymous BARs
- Adoption (anyone can steward)
- Persistence, practice

### decks.md
- Library, Equipped, In Play, Compost, Destroyed
- Equipped = passive nothing; active play only

### quests-slots.md
- Fixed slots, FCFS
- Minting on completion
- Provenance

### compost.md
- Composting, transformation requirement
- Expiration, destruction
- Tone: ecological

### slot-offers.md
- Withdrawal (1 vibeulon cost)
- Merge, Buyout
- Public offers, time override
- Response window

### capacity.md
- Hand size, refinement progression
- Capacity expansion via refinement actions

### design-principles.md
- P0: Vibes Must Flow
- P1: Signal → Seed → Cultivation → Action → Treasure
- P2: Sense and Respond

## Verification

- New player can read rules and understand the loop
- No contradictions between minting, compost, equipping, slot claiming
- Tone is dojo/ecology
- State transitions are clear

# Plan: Sustainability and Onboarding Lore

## Summary

Add wiki lore for onboarding path, sustainability, and financial model. Expand Bruised Banana page with dependency context. Update wiki index and lore index. Unblocks narrative throughput by providing a coherent story.

**Dependency context**: Bruised Banana Residency is created to develop Mastering the Game of Allyship and a Bruised Banana Organization instance. This emerged from joint ventures and connections between campaigns and instances.

## Implementation

### Phase 1: New Wiki Pages

**1.1 Onboarding path page**

**File**: `src/app/wiki/onboarding-path/page.tsx`

- Create page with sections: Flagship Program, Support Pyramid, Tiered Unlocks, Quest Creation, Value Proposition
- Content: Mastering the Game of Allyship teaches allyship basics and eventually creating/running storytelling instances; workshops (live then self-serve) → coaching (personalized quests, 1:1 support) → consulting (org integration); quest creation emerges from financial participation; self-service slower; value = "more fun way to do volunteer management and create open source projects"
- Link to `/wiki/campaign/bruised-banana` as first Allyship project

**1.2 Sustainability page**

**File**: `src/app/wiki/sustainability/page.tsx`

- Create page with sections: Dual Model, First Goal, Vibeulon Minting, Patreon MVP
- Content: non-profit (Patreon, fundraising for skilled organizing) first; profit (service-based subscription) later; Bruised Banana Residency = first sustainability goal; vibeulons from playing + capital injections (grants, crowdsourcing, pack purchases); Patreon = early access during beta; app eventually free with premium tiers
- Links to `/wiki/campaign/bruised-banana`, `/wiki/glossary#vibeulon`

**1.3 Integral Emergence / AI agents page**

**File**: `src/app/wiki/integral-emergence/page.tsx`

- Create page with sections: AI Agents as NPCs, Vibeulon Constraints, I Ching & Archetypes, Kotter Context, Human Advantage
- Content: AI agents act as NPCs; can create and resolve quests; can only mint vibeulons by completing story quests (not capital injections or real-world actions); can make I Ching draws; (future) will create quests that call in archetypes from hexagrams for players to create next; agents are Kotter-stage-context-aware (quest thread or campaign); appear as regular players; design goal = real users outpace AI via collaboration + minting vibeulons from real lives
- Links to `/wiki/glossary#vibeulon`, `/wiki/iching`, Kotter stages (glossary or moves)

### Phase 2: Expand Bruised Banana Page

**2.1 Add sustainability and dependency context**

**File**: `src/app/wiki/campaign/bruised-banana/page.tsx`

- Add section: "Sustainability Goal" — first sustainability goal for the app
- Add section: "Connection to Mastering the Game of Allyship" — Bruised Banana as first Allyship project
- Add section: "Dependency Context" — Residency enables (a) Mastering the Game of Allyship campaign and (b) Bruised Banana Organization instance; emerged from joint ventures and connections between campaigns and instances
- Add links to `/wiki/sustainability`, `/wiki/onboarding-path`

### Phase 3: Index Updates

**3.1 Wiki index**

**File**: `src/app/wiki/page.tsx`

- Add section "Sustainability & Onboarding" with links:
  - `/wiki/onboarding-path` — Onboarding Path (Workshops → Coaching → Consulting)
  - `/wiki/sustainability` — Sustainability & Financial Model
  - `/wiki/integral-emergence` — Integral Emergence (AI Agents & Human Advantage)

**3.2 Lore index**

**File**: `content/lore-index.md`

- Add "Mastering the Game of Allyship" to Campaign or new Programs section
- Add "Integral Emergence" and "AI agents" as concepts
- Add "Sustainability" as concept if needed

### Phase 4: Event Page Link (Optional)

**File**: `src/app/event/page.tsx`

- Add "Learn more" link in Wake Up section to `/wiki/sustainability` or `/wiki` (if not already present)

## File Impact Summary

| Action | File |
|--------|------|
| Create | `src/app/wiki/onboarding-path/page.tsx` |
| Create | `src/app/wiki/sustainability/page.tsx` |
| Create | `src/app/wiki/integral-emergence/page.tsx` |
| Edit | `src/app/wiki/campaign/bruised-banana/page.tsx` |
| Edit | `src/app/wiki/page.tsx` |
| Edit | `content/lore-index.md` |
| Edit (optional) | `src/app/event/page.tsx` |

## Verification

- Visit `/wiki/onboarding-path` — content displays
- Visit `/wiki/sustainability` — content displays
- Visit `/wiki/integral-emergence` — content displays
- Visit `/wiki/campaign/bruised-banana` — new sections visible
- Visit `/wiki` — Sustainability & Onboarding section with links
- Lore index includes new terms

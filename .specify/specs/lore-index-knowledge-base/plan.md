# Plan: Lore Index and Knowledge Base

## Summary

Create a canonical proper-noun index and knowledge base structure with linkable pages. Supports onboarding and invitations by providing lore that the Event Page and Event-Driven CYOA can reference.

## Implementation

### Phase 1: Index and Structure

**1.1 Lore index file**

**File**: `content/lore-index.md`

- Create canonical list of proper nouns by category
- Include slugs and wiki paths for each term
- Single source of truth for agents and content creators

**1.2 Wiki index route**

**File**: `src/app/wiki/page.tsx`

- Create index page listing all knowledge base entries by category
- Links to I Ching page (`/wiki/iching`), nations, archetypes, domains, moves, campaign, glossary
- Consistent styling with existing wiki (black bg, zinc text)

**1.3 Wiki layout**

**File**: `src/app/wiki/layout.tsx`

- Breadcrumb or "Back to app" link
- Consistent header/footer for wiki section

### Phase 2: Knowledge Base Pages

**2.1 Nations**

**File**: `src/app/wiki/nations/[slug]/page.tsx`

- Dynamic route for argyra, pyrakanth, virelune, meridia, lamenth
- Read content from `docs/handbook/nations/[slug].md` or render static summary with link to handbook

**2.2 Archetypes**

**File**: `src/app/wiki/archetypes/[slug]/page.tsx`

- Dynamic route for heaven, earth, thunder, wind, water, fire, mountain, lake
- Read from `docs/handbook/archetypes/[slug].md` or link to handbook

**2.3 Allyship domains**

**File**: `src/app/wiki/domains/page.tsx`

- List all 4 domains with definitions from `src/lib/allyship-domains.ts` and spec
- Optional: `/wiki/domains/[slug]` for per-domain pages

**2.4 4 Moves**

**File**: `src/app/wiki/moves/page.tsx`

- Content from `.agent/context/terminology.md` and FOUNDATIONS.md
- Wake Up, Clean Up, Grow Up, Show Up with definitions

**2.5 Bruised Banana campaign**

**File**: `src/app/wiki/campaign/bruised-banana/page.tsx`

- Residency, Fundraiser, house context (Wendell, Eddy, JJ)
- Link to Event Page
- Content from ANALYSIS.md and existing specs

**2.6 Glossary**

**File**: `src/app/wiki/glossary/page.tsx`

- Short definitions: Vibeulon, BAR, Kotter stages
- Content from terminology.md and FOUNDATIONS.md

### Phase 3: Event Page Integration

**3.1 Event page link**

**File**: `src/app/event/page.tsx`

- Add "Learn more" or "Glossary" link in Wake Up section or "Read more" details
- Link to `/wiki` or `/wiki/campaign/bruised-banana`

## File Structure

| Action | File |
|--------|------|
| Create | `content/lore-index.md` |
| Create | `src/app/wiki/page.tsx` |
| Create | `src/app/wiki/layout.tsx` |
| Create | `src/app/wiki/nations/[slug]/page.tsx` |
| Create | `src/app/wiki/archetypes/[slug]/page.tsx` |
| Create | `src/app/wiki/domains/page.tsx` |
| Create | `src/app/wiki/moves/page.tsx` |
| Create | `src/app/wiki/campaign/bruised-banana/page.tsx` |
| Create | `src/app/wiki/glossary/page.tsx` |
| Modify | `src/app/event/page.tsx` |

## Verification

- Visit `/wiki` → index page with links to all sections
- Visit `/wiki/campaign/bruised-banana` → Bruised Banana lore
- Visit `/wiki/moves` → 4 moves definitions
- Event page → "Learn more" link to wiki

## Reference

- Spec: [.specify/specs/lore-index-knowledge-base/spec.md](spec.md)
- Event-Driven CYOA: [.specify/backlog/prompts/event-driven-cyoa-developmental-assessment.md](../../backlog/prompts/event-driven-cyoa-developmental-assessment.md)

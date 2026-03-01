# Plan: Lore Index + Event-Driven CYOA Onboarding

## Summary

Create a canonical lore index and wiki, then use that content to enrich the CYOA onboarding. Event page and CYOA share Instance content; wiki provides definitions and extended campaign lore. Phase 1 builds the wiki; Phase 2 extends the CYOA with lore-aware nodes and developmental assessment.

## Phase 1: Lore Index and Wiki

### 1.1 Lore index file

**File**: `content/lore-index.md`

- Canonical list of proper nouns by category (Campaign, Nations, Archetypes, Domains, Moves, Economy, Kotter)
- Each term has slug and optional wiki path
- Single source of truth for agents and content creators

### 1.2 Wiki layout

**File**: `src/app/wiki/layout.tsx`

- Breadcrumb or "Back to app" link
- Consistent header/footer for wiki section (black bg, zinc text, match existing /wiki/iching)

### 1.3 Wiki index route

**File**: `src/app/wiki/page.tsx`

- Index page listing all knowledge base entries by category
- Links to I Ching (`/wiki/iching`), nations, archetypes, domains, moves, campaign, glossary

### 1.4 Knowledge base pages

| File | Content source |
|------|----------------|
| `src/app/wiki/campaign/bruised-banana/page.tsx` | Residency, Fundraiser, house (Wendell, Eddy, JJ); link to Event page; ANALYSIS.md |
| `src/app/wiki/moves/page.tsx` | 4 moves from terminology.md, FOUNDATIONS.md |
| `src/app/wiki/domains/page.tsx` | Allyship domains from allyship-domains.ts |
| `src/app/wiki/glossary/page.tsx` | Vibeulon, BAR, Kotter stages from terminology.md |

### 1.5 Event page link

**File**: `src/app/event/page.tsx`

- Add "Learn more" or "Glossary" link in Wake Up section or "Read more" details
- Link to `/wiki` or `/wiki/campaign/bruised-banana`

## Phase 2: CYOA Content Pipeline

### 2.1 Lore-aware CYOA nodes

**File**: `src/app/api/adventures/[slug]/[nodeId]/route.ts`

- Extend `getBruisedBananaNode()` to optionally append wiki links for terms (e.g., "Learn more about [vibeulons](/wiki/glossary#vibeulon)")
- BB_Intro and BB_ShowUp already use instance content; add optional "Learn more" choice to campaign page

### 2.2 Developmental assessment nodes

- Add new BB nodes (e.g. BB_Developmental_Intro, BB_Developmental_Q1, etc.) with choice-based questions
- Map choices to Integral Theory stages/lines (simplified)
- Store in campaignState; persist to storyProgress on sign-up

### 2.3 Personalized quest assignment

**File**: `src/actions/quest-thread.ts`

- `assignOrientationThreads` accepts optional params: nationId, playbookId, allyshipDomains, developmentalHint
- Use storyProgress from createCampaignPlayer to pass these params

### 2.4 Verification quest

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-lore-cyoa-onboarding-v1` — Twine story: visit /wiki, /event, play through BB CYOA, confirm character creation

## File Structure

| Action | File |
|--------|------|
| Create | `content/lore-index.md` |
| Create | `src/app/wiki/layout.tsx` |
| Create | `src/app/wiki/page.tsx` |
| Create | `src/app/wiki/campaign/bruised-banana/page.tsx` |
| Create | `src/app/wiki/moves/page.tsx` |
| Create | `src/app/wiki/domains/page.tsx` |
| Create | `src/app/wiki/glossary/page.tsx` |
| Modify | `src/app/event/page.tsx` |
| Modify | `src/app/api/adventures/[slug]/[nodeId]/route.ts` |
| Modify | `src/actions/quest-thread.ts` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Verification

- Visit `/wiki` — index page with links
- Visit `/wiki/campaign/bruised-banana` — Bruised Banana lore
- Visit `/wiki/moves` — 4 moves definitions
- Event page — "Learn more" link to wiki
- BB CYOA — optionally includes wiki links
- `npm run seed:cert:cyoa` — cert-lore-cyoa-onboarding-v1 appears

## Reference

- Spec: [.specify/specs/lore-cyoa-onboarding/spec.md](spec.md)
- Supersedes: [lore-index-knowledge-base](../lore-index-knowledge-base/spec.md), [event-driven-cyoa-developmental-assessment](../../backlog/prompts/event-driven-cyoa-developmental-assessment.md)

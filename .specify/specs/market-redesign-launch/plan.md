# Plan: Market Redesign for Launch

## Summary

Redesign the Market page so it shows only player-created quests, with easy filtering and exploration. Update NavBar to show "PLAY" on both mobile and desktop breakpoints. Add verification quest for the redesign.

## Implementation

### 1. Market = Player-created quests only

**File**: [src/actions/market.ts](../../src/actions/market.ts)

- Change `isSystem: isAdmin ? undefined : false` to `isSystem: false` so Market excludes system quests for all users (including admins).
- Graveyard remains admin-only; it fetches completed cert quests separately.
- No change to packs query.

### 2. Filter UI improvements

**File**: [src/app/bars/available/page.tsx](../../src/app/bars/available/page.tsx)

- Add allyship domain pills as a primary filter (client-side, like nation/archetype). Use `ALLYSHIP_DOMAINS` from `@/lib/allyship-domains`. Filter `others` by `bar.allyshipDomain` when domain pills are selected.
- Surface filters more prominently: search + domain pills in the main filter bar; nation and archetype remain. Consider moving "Advanced Filters" (Kotter stage) to a secondary row or keeping collapsible.
- Ensure "Clear all filters" resets domain selection (add `selectedDomains` state and include in `handleClearAllFilters`).
- Empty state: when `others.length === 0` and filters are active → "No quests found" + Clear filters. When `(content?.quests || []).length === 0` (no quests at all) → "No commissions yet. Create one to get started." with link to create BAR (e.g. `/bars` or create flow).
- Touch targets: ensure filter pills and buttons meet min 44px where possible.

### 3. Quest cards and layout

**File**: [src/app/bars/available/page.tsx](../../src/app/bars/available/page.tsx)

- Quest cards already show title, description, creator nation/archetype, domain, reward. Remove "System" badge from cards (no system quests in Market).
- Ensure cards are scannable on mobile (grid responsive, truncation).
- Campaign stage indicator already present in header; keep as-is.

### 4. NavBar: Play on all breakpoints

**File**: [src/components/NavBar.tsx](../../src/components/NavBar.tsx)

- Change Adventures link from conditional `sm:inline` / `sm:hidden` to always show "PLAY":
  - Replace `<span className="hidden sm:inline">PLAY</span><span className="sm:hidden">▶</span>` with `<span>PLAY</span>`.
- "PLAY" displays on both mobile and desktop.

### 5. Verification quest

**File**: [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)

- Add `cert-market-redesign-v1` to CERT_QUEST_IDS.
- Twine passages:
  - START: "Verify the Market redesign for the Bruised Banana launch. The Market shows player-created quests; Adventures hold campaign content."
  - STEP_1: Open Market. Confirm you see only player-created quests (no system quests). If no quests exist, confirm empty state.
  - STEP_2: Use search and filters (domain, nation, archetype). Confirm filtering works. Clear filters and confirm results return.
  - STEP_3: Open a quest and accept it (or confirm Details & Accept flow). Confirm you can pick up a quest.
  - STEP_4: Check the nav. Confirm Play link shows "PLAY" on both mobile and desktop.
  - END_SUCCESS: "Market redesign verified. Player quests are easy to find and explore." (no link)
  - FEEDBACK: Report an issue (tags: feedback)
- Upsert TwineStory and CustomBar.
- Narrative: "Validate the Market so guests can discover quests at the party."

### 6. Campaign path (optional)

- Keep Campaign Path form as collapsible "Update campaign path". It updates server-side preference; client-side domain pills provide quick filtering without changing preference.

## File structure

| Action | File |
|--------|------|
| Modify | `src/actions/market.ts` |
| Modify | `src/app/bars/available/page.tsx` |
| Modify | `src/components/NavBar.tsx` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Verification

- Market shows only `isSystem: false` quests for all users.
- Filter by domain, nation, archetype, search works; Clear all resets everything.
- Empty states: "No quests found" when filtered; "No commissions yet" when no quests.
- NavBar shows "PLAY" on mobile and desktop.
- `npm run seed:cert:cyoa` → cert-market-redesign-v1 appears.

## Reference

- Spec: [.specify/specs/market-redesign-launch/spec.md](spec.md)
- Market actions: [src/actions/market.ts](../../src/actions/market.ts)
- Allyship domains: [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts)

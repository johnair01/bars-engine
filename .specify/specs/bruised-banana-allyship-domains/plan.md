# Plan: Allyship Domains (WHERE) + Campaign Path Choice

## Summary
Add allyshipDomain to CustomBar (WHERE the quest lives), campaignDomainPreference to Player. Multi-select "Choose your campaign path" UX with opt-out. Persistent entry point to update preferences anytime. Market filters by preference. Seed Bruised Banana quests with allyshipDomain tags.

## Implementation

### 1. Schema
- **File**: `prisma/schema.prisma`
- Add `allyshipDomain String?` to CustomBar
- Add `campaignDomainPreference String?` to Player (JSON array; null/empty = show all)
- Run `npm run db:sync`

### 2. Quest creation
- **File**: `src/components/quest-creation/QuestWizard.tsx` — Add allyship domain selector (dropdown or checkboxes)
- **File**: `src/actions/create-bar.ts` — Accept and persist allyshipDomain

### 3. Player preference (multi-select, opt-out, sign-up-later)
- **File**: New or existing — Server action `updateCampaignDomainPreference(preference: string[])` to update Player
- **File**: "Choose your campaign path" component — Multi-select checkboxes; checked = include, unchecked = opt out; empty = show all
- **First-time**: Renders after onboarding or on first Market visit (when preference is null)
- **Sign up later**: Persistent "Update campaign path" link on Market page (and optionally Settings/Profile). Same form; no gate.

### 4. Market filter
- **File**: `src/actions/market.ts` — When `player.campaignDomainPreference` is non-empty array, filter CustomBars by `allyshipDomain` in preference. Null/empty = show all.

### 5. Seed Bruised Banana quests
- **File**: `scripts/seed-bruised-banana-quests.ts` — Create quests with allowedNations, allowedTrigrams, allyshipDomain. Use [data/party_seed_bb_bday_001.json](data/party_seed_bb_bday_001.json) as source.

## Verification

- Create quest with allyship domain → persists
- Set campaign domain preference (multi-select) → Market shows matching quests
- Opt out (uncheck all) or empty preference → Market shows all quests
- "Update campaign path" on Market → update preferences anytime; changes persist
- Seed script creates quests with allyshipDomain tags

## Reference

- Spec: [.specify/specs/bruised-banana-allyship-domains/spec.md](spec.md)
- Cursor plan: Blocker 4

# Plan: Campaign Entry UI

## Summary

Add a dismissible Campaign Entry banner on the dashboard for Bruised Banana players. Shows Nation, Archetype, Intended Impact, and starter quests on first visit. One schema change (hasSeenCampaignEntry); one new component; one server action.

## Phases

### Phase 1: Schema and Server Action

1. Add `hasSeenCampaignEntry Boolean @default(false)` to Player in prisma/schema.prisma.
2. Run `npm run db:sync`.
3. Create `dismissCampaignEntry(playerId?)` in src/actions/onboarding.ts (or new file). Sets hasSeenCampaignEntry, revalidates `/`.

### Phase 2: CampaignEntryBanner Component

1. Create `src/components/campaign/CampaignEntryBanner.tsx` (client component).
2. Props: `nation`, `playbook`, `intendedImpact` (string or string[]), `starterQuests` (array of { id, title }).
3. Layout: headline, identity row (Nation, Archetype with links), Intended Impact, quest list, "Enter the Flow" button.
4. Dismiss: call `dismissCampaignEntry` server action on button click.

### Phase 3: Home Page Integration

1. In src/app/page.tsx: fetch `hasSeenCampaignEntry` from Player.
2. Fetch ThreadProgress for `bruised-banana-orientation-thread` (include thread with quests).
3. Derive `intendedImpact`: from storyProgress.state.lens or campaignDomainPreference → friendly labels.
4. Condition: `showCampaignEntry = hasBbThread && !hasSeenCampaignEntry`.
5. Render CampaignEntryBanner when true (placement: after RITUAL SUCCESS BANNER or EVENT MODE BANNER, before WELCOME SCREEN).

## File Impacts

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add hasSeenCampaignEntry to Player |
| `src/actions/onboarding.ts` | Add dismissCampaignEntry |
| `src/components/campaign/CampaignEntryBanner.tsx` | Create |
| `src/app/page.tsx` | Add fetch logic and CampaignEntryBanner render |

## Data Flow

```
Player lands on /
  → Fetch: hasSeenCampaignEntry, ThreadProgress(bruised-banana-orientation-thread)
  → If hasBbThread && !hasSeenCampaignEntry:
      → Render CampaignEntryBanner(nation, playbook, intendedImpact, starterQuests)
  → User clicks "Enter the Flow"
      → dismissCampaignEntry()
      → hasSeenCampaignEntry = true, revalidatePath('/')
      → Banner no longer shown
```

## Dependencies

- onboarding-flow-completion (done)
- bruised-banana-orientation-thread (existing)
- ALLYSHIP_DOMAINS for domain labels

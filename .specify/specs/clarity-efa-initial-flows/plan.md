# Plan: Clarity and EFA in Initial Flows

## Summary

Add clarity strips to landing and event; Do this next strip on dashboard; surface EFA in initial flows; residency progress connection on dashboard and gameboard; simplify GetStartedPane.

## Phases

### Phase 1: Landing + Event clarity

- **Landing**: Add `ClarityLine` or inline text under CTAs: "Play quests, try Emotional First Aid when stuck, and support the residency."
- **Event page**: Add `HowToGetInvolvedStrip` component below header or above Wake Up: 3 bullets with links (Play quests, Donate, Try EFA).

### Phase 2: Dashboard Do this next + EFA elevation

- **DoThisNextStrip**: New component. Logic: if no active quest → "Pick a quest from Gameboard" + EFA; if active quest → "Continue: [Quest title]" + EFA link if stuck; always include residency connection.
- **EFA elevation**: For new players (no completed quests), move EFA card higher in dashboard layout; add "New here? Start with Emotional First Aid" copy.

### Phase 3: Campaign initiation EFA beat

- **Option A**: Add Passage to bruised-banana-initiation: "Feeling overwhelmed? Try Emotional First Aid first" → link to /emotional-first-aid.
- **Option B**: Add card/component above CampaignReader on initiation page: "Before you begin: Optional 2-min Emotional First Aid check-in."
- Prefer Option B for minimal content changes (no Twee/Passage edits).

### Phase 4: Residency progress strips

- **Dashboard**: Add compact strip: "Bruised Banana: Stage X — Your quests move us forward." Use activeInstance or hardcode bruised-banana.
- **Gameboard**: Add header line above content: "Campaign quests — completing these supports the Bruised Banana residency."

### Phase 5: Simplify GetStartedPane + nav hook

- **GetStartedPane**: Collapse by default; reduce to 3 bullets: Play quests on Gameboard, Try EFA when stuck, Donate. Move wiki links to "Learn more" secondary.
- **Nav**: Add "Game Map" or "What to do" link in header/nav for logged-in users. Check existing layout (DashboardSectionButtons, etc.).

## File Impacts

| File | Action |
|------|--------|
| `src/app/page.tsx` | Add clarity line (landing); add DoThisNextStrip, residency strip, EFA elevation (dashboard) |
| `src/app/event/page.tsx` | Add HowToGetInvolvedStrip |
| `src/components/GetStartedPane.tsx` | Simplify; collapse by default; 3 bullets |
| `src/components/DoThisNextStrip.tsx` | Create — do this next logic |
| `src/components/HowToGetInvolvedStrip.tsx` | Create — event page strip |
| `src/app/campaign/initiation/page.tsx` | Add EFA card option |

## Dependencies

- bruised-banana-onboarding-flow
- dashboard-ui-vibe-cleanup

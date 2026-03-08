# Plan: Certification Quest — Onboarding Quest Generation Unblock

## Summary

Add `cert-onboarding-quest-generation-unblock-v1` to the CYOA certification seed script. The quest validates the onboarding quest generation unblock flow: I Ching step, feedback/regenerate, skeleton-first, structural validity, and publish. Narrative ties to Bruised Banana Fundraiser preparation.

## Phases

### Phase 1: Add cert quest to seed script

- Add `'cert-onboarding-quest-generation-unblock-v1'` to `CERT_QUEST_IDS` in `scripts/seed-cyoa-certification-quests.ts`.
- Add new seed block after `cert-quest-grammar-v1` (or similar) with:
  - TwineStory: title, slug, parsedJson (passages)
  - CustomBar: id, title, description, reward, twineStoryId, backlogPromptPath

### Phase 2: Define passages

- **START**: Intro — verify onboarding quest generation flow (I Ching, feedback, skeleton, publish); prepare quests for Bruised Banana party.
- **STEP_1**: Open [admin quest grammar](/admin/quest-grammar); switch to CYOA tab.
- **STEP_2**: Complete unpacking Q1–Q7; reach I Ching step; cast or select hexagram.
- **STEP_3**: Reach Generate step; click Generate Skeleton or Generate with AI.
- **STEP_4**: Give feedback; click Regenerate; confirm output updates.
- **STEP_5**: Confirm output structurally valid (nodes, choices, reachable completion).
- **STEP_6**: Publish to Campaign or Export .twee.
- **FEEDBACK**: Report Issue passage (tags: `['feedback']`).
- **END_SUCCESS**: Verification complete; vibeulon reward.

### Phase 3: Verification

- Run `npm run seed:cert:cyoa`.
- Confirm quest appears on Adventures page.
- Manually run through cert quest to validate flow.

## File Impacts

| File | Action |
|------|--------|
| `scripts/seed-cyoa-certification-quests.ts` | Add CERT_QUEST_IDS entry; add seed block for cert-onboarding-quest-generation-unblock-v1 |

## Dependencies

- onboarding-quest-generation-unblock (DJ) — feature implemented
- cyoa-certification-quests — certification pattern
- cert-quest-passage-links — markdown links in passage text

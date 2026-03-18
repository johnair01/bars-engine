# INV-3 Implementation Plan

## Phase 1: Arrival Page

1. Create `/arrival` route — server component
2. Fetch player with invitedBy, nation, archetype
3. Show only when `invitedByPlayerId` is set (invite sign-up)
4. Render: greeting by name, inviter name, nation/archetype labels, first quest CTA

## Phase 2: Redirect

1. InviteSignupForm: change redirect from `/?ritualComplete=true` to `/arrival` on success

## Phase 3: First Quest

1. Use getPlayerThreads or ThreadProgress to get first quest from orientation thread
2. Pin one quest as "Your first quest" with link to accept/start

## File Impacts

| Action | Path |
|--------|------|
| Create | `src/app/arrival/page.tsx` |
| Modify | `src/app/invite/[token]/InviteSignupForm.tsx` |

## Dependencies

- assignOrientationThreads (already called in createCharacter)
- getPlayerThreads or direct ThreadProgress + ThreadQuest query

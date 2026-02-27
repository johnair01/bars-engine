# Plan: Fundraiser Landing Refactor (T Revision)

## Summary

Remove the 4 moves grid from the landing page; make the Event page the primary invite landing with Wake Up (Learn the story) and Show Up (Contribute OR Play) sections. Update InviteButton to copy `/event?ref=bruised-banana`.

## Implementation

### 1. Landing page: remove moves grid

**File**: `src/app/page.tsx`

- Delete the grid of 4 move cards (Wake Up, Clean Up, Grow Up, Show Up) — lines 64–81.
- Keep hero (title, subtitle).
- Keep Live Instance card when `activeInstance?.isEventMode` (links to /event).
- Keep CTAs: Sign Up (primary), Begin the Journey (secondary), Log In, Support the Residency.
- Optionally: when `ref=bruised-banana`, redirect to `/event?ref=bruised-banana` so invite links to home still land on fundraiser. (Defer if not in spec.)

### 2. Event page: add Wake Up section

**File**: `src/app/event/page.tsx`

- Add "Wake Up: Learn the story" section before or after the fundraiser progress.
- Content: instance.theme, instance.targetDescription, or a dedicated story block. Use expandable `<details>` or inline prose.
- Label: "Wake Up" with subtitle "Learn the story of the Bruised Banana Residency".

### 3. Event page: add Show Up section

**File**: `src/app/event/page.tsx`

- Restructure existing "Enter the engine" section into "Show Up: Contribute to the campaign".
- Two paths: (a) Contribute money — existing Sponsor/Patreon buttons; (b) Play the game — Sign Up link with ref, Log In.
- Move InviteButton into this section or keep alongside.
- Ensure Sign Up link includes `?ref=bruised-banana`.

### 4. InviteButton: update URL

**File**: `src/app/event/InviteButton.tsx`

- Change copied URL from `/?ref=bruised-banana` to `/event?ref=bruised-banana`.

## File impacts

| File | Change |
|------|--------|
| `src/app/page.tsx` | Remove 4 moves grid |
| `src/app/event/page.tsx` | Add Wake Up section; restructure Show Up section |
| `src/app/event/InviteButton.tsx` | Copy `/event?ref=bruised-banana` |

## Verification

- Visit `/` logged out: no moves grid; hero + CTAs visible.
- Visit `/event?ref=bruised-banana`: Wake Up and Show Up sections visible.
- Click Invite friends: clipboard has `.../event?ref=bruised-banana`.
- Sign up from Event page: campaignRef stored; redirect works.

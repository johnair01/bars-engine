# Tasks: Public teaser — `/play` loop

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Implementation

- [ ] Add **public branch** on `/play`: when `getCurrentPlayer()` is null, render teaser (no `redirect('/conclave/guided')`).
- [ ] Teaser: three sections (Charge, Scene Atlas, I Ching) with **invitational** copy; use `SCENE_ATLAS_DISPLAY_NAME` / `SCENE_ATLAS_TAGLINE` for step 2.
- [ ] Teaser CTAs: **Log in** links with `callbackUrl` to `/capture`, `/creator-scene-deck` (or slug if required), `/iching` — verify against existing `login` query contract in codebase.
- [ ] Teaser: secondary **join / conclave** link per `plan.md` default.
- [ ] Signed-in branch: keep **current** full loop UI (refactor into subcomponent if it clarifies `page.tsx`).
- [ ] Public teaser: **←** link — use **`/`** or **`/campaign`** (not “Dashboard” for logged-out); adjust copy to **“Home”** or **“Back”**.

## Verification

- [ ] Incognito: `/play` renders teaser, no redirect loop.
- [ ] Logged in: `/play` unchanged functionally vs before teaser work.
- [ ] `npm run check` passes.

## Post-ship (optional)

- [ ] Wiki one-liner or handbook cross-link to `/play` for “what is the loop?” (separate docs task if desired).

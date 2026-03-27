# Runbook: MtGoA Chapter 1 — Book CYOA demo

**Spec:** [.specify/specs/book-cyoa-campaign/spec.md](../../.specify/specs/book-cyoa-campaign/spec.md)

## Canonical URL

- **Campaign CYOA:** `/campaign?ref=mtgoa-chapter-1-demo`
- After seed, the app resolves `Adventure` with `campaignRef=mtgoa-chapter-1-demo` and slug `mtgoa-chapter-1`.

## Preconditions

1. **Database** — `DATABASE_URL` set (see `docs/ENV_AND_VERCEL.md`).
2. **At least one `Player` row** — the seed uses the first player as `CustomBar.creatorId` for the demo quest.
3. **Seed script** — `npm run seed:mtgoa-ch1`

## 5-step click path (happy path)

1. Sign in (or create an account) so `takeQuest` can assign the demo quest.
2. Open **`/campaign?ref=mtgoa-chapter-1-demo`**.
3. Read **Start** → **Epiphany Bridge** → **Practice** (passage with linked library quest).
4. Click **Take quest** — assigns `PlayerQuest` and navigates to the quest BAR (`/bars/{id}`).
5. Complete or leave in Vault; optional: **Chapter 1 recap** → **Quest Library** / **Home** (redirect choices).

## Auth model (Phase 1)

- **Individual signup** — same as rest of the app; no shared demo login required for v1.
- Logged-out users can still read passages; **Take quest** returns an error until they sign in.

## What gets seeded

- `Book` (slug `mastering-the-game-of-allyship`, status `published`)
- One **system** `CustomBar` quest (title contains `MtGoA Chapter 1 — Allyship stance (demo)`)
- `QuestThread` for the book + `ThreadQuest` + `QuestThread.adventureId` → Adventure
- `QuestAdventureLink` (`wakeUp`) for quest ↔ adventure
- `Adventure` + `Passage` graph (`MTGOA_CH1_*` nodes) with `metadata.passageType` / `move` on key beats

## Non-goals (Phase 1)

- Full book / later chapters (use same pattern in a follow-up spec).
- Player-authored CYOA (see spec: steward-seeded only for v1).
- UGA graph validation on admin Passage save (manual QA + seed review until UGA ships).

## Admin: link thread to adventure manually

Server action: `linkLibraryThreadToAdventure(threadId, adventureId)` in `src/actions/book-cyoa-campaign.ts` (admin-only). The seed sets this automatically.

# Tasks: Podcast route

**Input:** [spec.md](./spec.md), [data-model.md](./data-model.md), [plan.md](./plan.md)

## Phase 0 — Before the page

- [ ] T000 Merge PR #243 (`/podcasts` → `/on-your-show`).
- [ ] T001 Wendell: create the show on Zencastr; hand over `PODCAST_FEED_URL` and the show's name. Due Sat Sep 19.
- [ ] T002 Draft three versions of the promise paragraph (R14); scan each in isolation; Wendell picks one. Due Sat Sep 19.

## Phase 1 — Slice one, by Tue Sep 29

- [ ] T010 Add `PodcastGuestApplication` and `PodcastQuestion` to `prisma/schema.prisma` per data-model.md; generate the migration offline; commit it.
- [ ] T011 [P] `src/lib/podcast/options.ts`: re-export the three fixed sets; define naming values, `not_sure`, and both status chains with a `canTransition` helper. Test.
- [ ] T012 [P] `src/lib/podcast/feed.ts`: fetch, parse, map, cache; empty list on failure. Test with a fixture feed and a malformed one.
- [ ] T013 `scripts/check-podcast-feed.ts` (FR8); wire into `npm run build` after `validate:routes`; warns and passes when unset.
- [ ] T014 `src/lib/podcast/copy.ts`: receipts and the sanctioned promise; scan in isolation.
- [ ] T015 `src/actions/podcast.ts`: `submitQuestion` (validate, consent required, store, email, Kit only on opt-in) and `submitGuestApplication` (validate per type, consent required, MythRead link for coaching, store, email). Tests for both, including the two Kit branches and the per-type field rules.
- [ ] T016 `src/app/podcast/page.tsx` with route annotations; head, episode list with native players, campaign links from `PodcastEpisode` when present, empty state.
- [ ] T017 [P] `QuestionForm.tsx` and `GuestApplicationForm.tsx` in the introductions form's shape; type switch shows only that type's fields.
- [ ] T018 Add `/podcast` to `footer-surfaces.ts`, its test, and the footer link list.
- [ ] T019 Add the new tests to the vitest include list; run `validate:routes`; run the slop scan on the diff.
- [ ] T020 Set `PODCAST_FEED_URL`, `PODCAST_SHOW_NAME`, `PODCAST_SHOW_LINE`, `PODCAST_NOTIFY_TO` on Vercel.
- [ ] T021 PR up by Fri Sep 26 for Wendell's review; live Tue Sep 29 with episode 1.

**Checkpoint:** a listener can play episode 1, ask a question, and apply. Wendell gets an email for each. Nothing else.

## Phase 2 — Slice two

- [ ] T030 Add `PodcastEpisode`; migration offline.
- [ ] T031 `/admin/podcast`: applications and questions with status transitions limited by `canTransition`; attach a question to an episode; record a campaign id at approval.
- [ ] T032 `/podcast/review/[token]`: the four choices, cuts as timestamps, withdraw available after publish, `withdrawnAt` hides the episode at once and flags it for feed removal.
- [ ] T033 Under each published episode, list `answered` questions in the asker's naming (R9, R12).
- [ ] T034 Guest setup guide with the tape rule (R8) and the pre-record questions; lives with the Coliven playbook, linked from the application receipt.
- [ ] T035 Approval prefill into the campaign create flow (FR13).

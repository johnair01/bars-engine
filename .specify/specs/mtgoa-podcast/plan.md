# Implementation Plan: Podcast route

**Branch**: `podcast/route` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

## Summary

Slice one, by Tue Sep 29: `/podcast` reads the Zencastr feed on the server and renders a native player per episode, takes a listener's question for air, and takes a guest application of either type. Two rows, two server actions, one email per submission, one feed parser. Slice two: the guest review link, the admin list, and campaign creation at approval.

## Technical context

**Language/Version**: TypeScript, Next.js App Router, React, Prisma
**Primary dependencies**: `fast-xml-parser` for the feed (the one new dependency); existing `sendEmail`, `syncSubscriber`, fixed option sets
**Storage**: PostgreSQL via Prisma. Two new tables in slice one, one in slice two
**Testing**: `tsx`-run assert tests beside the modules, as `footer-surfaces.test.ts` does; add each to the vitest include list
**Constraints**: no account, no third-party script or iframe, consent stored on every row, Kit gated on opt-in, migrations generated offline
**Dates**: PR #243 merged first. Wendell's feed URL, show name, and sanctioned promise by Sat Sep 19. PR review Fri Sep 26. Live Tue Sep 29.

## Project structure

```text
.specify/specs/mtgoa-podcast/
├── spec.md
├── data-model.md
├── plan.md
└── tasks.md

src/
├── app/podcast/page.tsx                      # show head, episode list, both forms
├── app/podcast/QuestionForm.tsx
├── app/podcast/GuestApplicationForm.tsx
├── app/podcast/review/[token]/page.tsx       # slice two
├── app/admin/podcast/page.tsx                # slice two
├── actions/podcast.ts                        # submitQuestion, submitGuestApplication
├── lib/podcast/feed.ts                       # fetch + parse + cache
├── lib/podcast/options.ts                    # the fixed sets, re-exported, plus naming and status chains
├── lib/podcast/copy.ts                       # the promise paragraph and both receipts, sanctioned strings only
├── lib/podcast/__tests__/feed.test.ts
├── lib/podcast/__tests__/options.test.ts
└── actions/__tests__/podcast.test.ts
scripts/check-podcast-feed.ts                 # FR8, wired into build
```

## Decisions

| Topic | Decision |
|---|---|
| Feed reading | Server-side `fetch` with `next: { revalidate: 600 }`, parsed by `fast-xml-parser`, mapped to `{guid, title, publishedAt, enclosureUrl, enclosureType, description}`. A parse failure returns the empty list and logs; the page renders its empty state. |
| Player | `<audio controls preload="none" src={enclosureUrl}>`. No client component. |
| Empty state | Head plus the line "First episode Sep 29." until the feed has an item. |
| Forms | Client components in the shape of `IntroductionForm.tsx`, posting to server actions. Fixed sets rendered as radio and checkbox groups from `options.ts`. |
| Fixed sets | `ALLYSHIP_DOMAINS`, `SUPERPOWERS`, `MTGOA_MOVE_ORDER` re-exported, never copied. |
| Kit | Called only when `listOptIn` is true. A test covers both branches. |
| Email | `sendEmail` to `PODCAST_NOTIFY_TO`, persist-then-send, one per submission, text body listing the fields. |
| Copy | Every human-facing string in `copy.ts`, scanned with `no-ai-slop/scan.py` in isolation before it lands. The promise paragraph is Wendell's sanctioned wording only. |
| Campaign at approval | Manual through `/admin/campaigns/create` in slice one; FR13 prefill in slice two. |
| Review link | Slice two. Token per `PodcastEpisode`, emailed, no account. |

## Constitution check

Reuses existing models and actions before adding any; keeps public and steward data separate; one server render; independently shippable slices. Pass.

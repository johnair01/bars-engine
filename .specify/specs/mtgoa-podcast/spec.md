# Feature Specification: Mastering the Game of Allyship Podcast route

**Feature Branch**: `podcast/route`
**Created**: 2026-09-15
**Status**: Ratified. Intake closed 2026-09-15; four six-faces records ratified the same day.
**Input**: Wendell's intake: a route where people listen to episodes, submit questions to the podcast, and sign up to be a guest. Guests get allyship coaching in exchange for the episode and have final say on whether it goes live. Two episode types: a person recruiting skilled allies for their cause, and a person working on their own allyship, coached on air.

Source records live in the vault under `06 Specs/`: `MTGOA Podcast Route Intake v0.1`, and the three council records `MTGOA Podcast Route Six Faces`, `MTGOA Podcast Questions Six Faces`, `MTGOA Podcast Ship Order Six Faces`, all dated 2026-09-15.

## Product decision

`/podcast` is the show Wendell hosts. It plays episodes from the Zencastr feed, takes a listener's question for air, and takes a guest application. The booking page for other people's shows lives at `/on-your-show` (PR #243) and is a different door for a different chair.

The show gathers on behalf of the guest. A recruiting guest's cause becomes a campaign in the organization network, and the episode's call to action points at it. For a coaching guest, the episode is the coaching. The exchange is public coaching for a public episode; the 1:1 is the private path and is named once on the page.

Slice one ships with episode 1 on 2026-09-29 and stops at the rim: the page, the player, the two forms, their receipts, and an email to Wendell per submission. Slice two adds the review link, an admin list, the guest setup guide, and campaign creation at approval.

## Existing capabilities this feature reuses

- `TourIntroduction` and `submitIntroduction` (`src/actions/introductions.ts`): the accountless form with a consent boolean and a status field. The two new rows copy its shape.
- `sendEmail` (`src/lib/email/send.ts`): the canonical send, persist-then-send, never throws.
- `syncSubscriber` (`src/lib/esp/kit.ts`): the Kit sync. In this feature it runs only behind a separate opt-in that is unchecked by default.
- `Campaign`, `CampaignStatus.PENDING_REVIEW`, `CampaignLead`, and the admin campaign create flow (`src/app/admin/campaigns/create`): a recruiting guest's cause is created there by hand in slice one.
- `ALLYSHIP_DOMAINS` (`src/lib/allyship-domains.ts`), `SUPERPOWERS` (`src/lib/superpowers/types.ts`), `MTGOA_MOVE_ORDER` (`src/lib/mtgoa-course/course-days.ts`): the three fixed option sets the forms use.
- `MythRead` (email, consent, topMyths): linked to a coaching application by email when one exists.
- The dark register of `src/app/on-your-show/page.tsx`: the page is built in that style. No design canvas.

## Rulings the build follows

These are ratified. Change one only by reopening the council.

| # | Ruling |
|---|---|
| R1 | Two doors. `/podcast` is the show. `/on-your-show` is booking Wendell on other shows. `/go/host` is the one-ask page for hosts. |
| R2 | Audio lives on Zencastr, which hosts and publishes the feed. The site reads that feed on the server, caches it for minutes, and renders a native audio element per episode. No embed. A build-time check confirms the first enclosure plays; if it ever fails, an embed is a new decision. |
| R3 | The guest application asks fixed choices. Shared: name, email, consent, episode type. Recruiting: cause name, one-paragraph description (these become the campaign), the number it aims for, one allyship domain, allies needed from the seven superpowers. Coaching: the move they are stuck at, one of five. A Myths Read result is linked by email when present. No general note field. |
| R4 | The application row is the record. An email to Wendell on every submission. A row in the Podcast Outreach sheet is added by hand as part of the daily move until a sync exists. |
| R5 | Statuses: `applied → booked → recorded → guest_review → approved \| withdrawn → published → shared`, with `declined` and `parked` as exits. |
| R6 | A recruiting guest's campaign is created at approval, by Wendell, in `PENDING_REVIEW`, with the guest as a `CampaignLead`. The application stores the campaign id. |
| R7 | Final say holds forever. Before publish: a per-episode review link, no account, four choices: publish, publish after cuts, hold, withdraw. Cuts are timestamps. After publish: withdraw removes the episode from the feed and from `/podcast` within two days, leaves no public record, and the episode number is skipped, never reassigned. Withdrawing an episode does not close the guest's campaign. |
| R8 | The guest setup guide carries the rule for people named on the tape: no names, no identifying combinations; the capture is posted and the person is not. Wendell says it again before recording. The cuts step is the backstop. |
| R9 | A listener's question is asked for air only. It is read in a standing segment when the host picks it. No written answers, no private answers. Under an episode, `/podcast` lists the questions it answered, in the asker's chosen naming, generated from the record. |
| R10 | A question points at a move, one of five or `not_sure`, which the host resolves at triage. An episode can be attached, optional. |
| R11 | Naming is the asker's and minimal: `anonymous` (default), `first_name`, `first_name_town`. One required consent to be read on air. Email is for the record. Kit sync only through a separate opt-in, gated in code. |
| R12 | A question never reaches a guest. A question about a cause belongs on the campaign through its own steward-routed door; each recruiting episode links to its campaign. |
| R13 | Question statuses: `new → queued → answered`, `parked` as exit. `answered` stores the episode. |
| R14 | The page's promise to guests is three sentences: the exchange (the episode is the coaching, in public), the private path (the 1:1, named once, no price), the concession (none of it is required). Wendell sanctions the wording from three drafts. |
| R15 | Sep 29 holds. The page has an honest state for an empty or missing feed. |

## User scenarios

### US1 — Listen (P1)

A visitor opens `/podcast`, sees the show's name and one line about it, and a list of episodes newest first. Each episode has a title, a date, a native player, its type (recruiting or coaching) and, for a recruiting episode, a link to the campaign it gathers for. Pressing play plays.

**Independent test**: with `PODCAST_FEED_URL` set to the Zencastr feed, the page renders every item in the feed with a working `<audio>` element. With the variable unset or the feed empty, the page renders the show's head and says the first episode lands on Sep 29.

**Acceptance**:
1. Given a feed with items, when the page loads, then each item renders with title, date, and an audio element whose `src` is the item's enclosure URL.
2. Given the feed is unreachable, when the page loads, then the last cached list renders, and if there is none, the empty state renders. The page never 500s on the feed.
3. Given an episode has a campaign attached in the record, when it renders, then it links to `/organization/campaigns/[slug]`.

### US2 — Ask a question (P1)

A listener submits a question for air. They pick the move it belongs to or `not_sure`, optionally the episode that prompted it, how they want to be named, tick consent to be read on air, and give an email. The receipt says: it may be read on air, it may not be picked, there is no private reply, and questions can be parked at the end of a season.

**Independent test**: submit a question with consent; a `PodcastQuestion` row exists with status `new`, Wendell receives one email, and the Kit sync did not run because the opt-in was unchecked.

**Acceptance**:
1. Given consent is unticked, when the form submits, then the action refuses with a message that says why, and nothing is stored.
2. Given the opt-in is unticked, when the row is stored, then `syncSubscriber` is not called.
3. Given the opt-in is ticked, when the row is stored, then `syncSubscriber` is called once with tag `source:podcast-question`.
4. Given the question text is empty, when the form submits, then it refuses.

### US3 — Apply to be a guest (P1)

A visitor picks recruiting or coaching, fills the fixed fields for that type, ticks consent, and submits. The receipt says what happens next: Wendell reads it, replies from his own address, and a pre-record call happens before anything is scheduled. The page above the form carries the three-sentence promise.

**Independent test**: submit one application of each type; two `PodcastGuestApplication` rows exist with status `applied`, each with only the fields its type allows, and Wendell receives two emails.

**Acceptance**:
1. Given type is `recruiting`, when the form submits, then cause name, description, target number, domain, and at least one superpower are required, and the move field is null.
2. Given type is `coaching`, when the form submits, then the move is required and the recruiting fields are null.
3. Given a `MythRead` row exists for the applicant's email, when a coaching application is stored, then `mythReadId` is set to the newest one.
4. Given a domain, superpower, or move value outside its fixed set, when the form submits, then it refuses.

### US4 — Wendell triages (slice two)

Wendell opens `/admin/podcast`, sees applications and questions with their status, moves a status forward, attaches a question to an episode, and on approving a recruiting guest, records the campaign id.

### US5 — A guest gives final say (slice two)

A guest opens the review link from their email, listens, and picks publish, publish after cuts, hold, or withdraw. Cuts take timestamps. After publish, withdraw is still available on the same link.

## Functional requirements

### Slice one

- FR1: `GET /podcast` renders the show head from `PODCAST_SHOW_NAME` and `PODCAST_SHOW_LINE`, and the episode list from `PODCAST_FEED_URL`, parsed on the server and cached with a short revalidation.
- FR2: Each episode renders a native `<audio controls preload="none">` with the enclosure URL, the title, the publish date, and the type and campaign link when a `PodcastEpisode` row matches the feed item's GUID.
- FR3: The question form posts to a server action that validates against the fixed sets, requires consent, stores a `PodcastQuestion`, sends one email to Wendell, and syncs to Kit only when `listOptIn` is true.
- FR4: The guest application form posts to a server action that validates per type against the fixed sets, requires consent, stores a `PodcastGuestApplication`, links a `MythRead` by email for coaching applicants, and sends one email to Wendell.
- FR5: Both receipts say what the rulings say they say (R9 for questions; the pre-record call and reply-from-a-person for applications).
- FR6: The page carries the three-sentence promise (R14), sanctioned copy only.
- FR7: `/podcast` is in the footer surface allowlist and the footer carries a link to it.
- FR8: A build-time script fetches the feed, if configured, and asserts the first enclosure responds with an audio content type. It warns and passes when the feed is unset or empty.

### Slice two

- FR9: `/admin/podcast` lists applications and questions, with status transitions limited to the chains in R5 and R13.
- FR10: A `PodcastEpisode` row is created per feed GUID at publish, holding type, guest application id, campaign id, and the review token.
- FR11: `GET /podcast/review/[token]` renders the guest's four choices; the action stores the choice, timestamps for cuts, and a `withdrawnAt` that hides the episode from `/podcast` immediately and flags it for removal from the feed.
- FR12: Under each published episode, `/podcast` lists questions with status `answered` and that episode's id, in the asker's chosen naming.
- FR13: Approving a recruiting application from `/admin/podcast` opens the existing campaign create flow prefilled with the cause name, description, domain, and target, and writes the resulting campaign id back to the application.

## Non-functional requirements

- No account for any public action. No third-party script or iframe on `/podcast`.
- Consent is stored on every row. The Kit sync is gated on the row's opt-in in code, with a test for both branches.
- Public HTML never contains an asker's email, an applicant's email, or a guest's cuts.
- Migrations are generated offline (`prisma migrate diff`) and applied by the Vercel build. Nothing runs against the database from a laptop.
- The page renders in one server pass with no client data-fetching waterfall.

## Verification tests

| Level | Name | What it checks |
|---|---|---|
| L1 | Smoke | `/podcast` and `/podcast/page.tsx` annotations pass `validate:routes`; the two actions import. |
| L2 | Data contract | Feed parser returns `{guid, title, publishedAt, enclosureUrl, enclosureType}` per item; both actions reject values outside the fixed sets. |
| L3 | Integration | Question with opt-in off stores a row and does not call Kit; with opt-in on calls Kit once. Application of each type stores only its type's fields. |
| L4 | UI | Page renders the empty-feed state without the env var; renders a player per item with a fixture feed. |

## Dependencies

- PR #243 (`/podcasts` → `/on-your-show`) merged first.
- Wendell, by Sat Sep 19: the Zencastr show created, `PODCAST_FEED_URL` and the show's name; the promise paragraph sanctioned from three drafts.
- Env on Vercel: `PODCAST_FEED_URL`, `PODCAST_SHOW_NAME`, `PODCAST_SHOW_LINE`, `PODCAST_NOTIFY_TO`.

## Out of scope

Written answers to questions. Private answers. Forwarding questions to guests. A sheet sync. A design canvas. Anything past the rim in slice one.
